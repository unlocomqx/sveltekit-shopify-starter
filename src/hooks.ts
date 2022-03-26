import { prisma } from "$lib/database/client"
import { getOfflineToken } from "$lib/database/models/OfflineSession"
import { getShopByName } from "$lib/database/models/Shop"
import { sessionStorage } from "$lib/shopify/session-storage"
import { verify } from "$lib/shopify/verify"
import { processAppUninstalled, processProductDeleted, processProductUpdated } from "$lib/shopify/webhooks"
import type { Shop } from "@prisma/client"
import type { Handle } from "@sveltejs/kit"
import type { AuthValidationResult, RegisterReturn } from "sveltekit-shopify-api"
import { AccessMode, ApiVersion, Shopify } from "sveltekit-shopify-api"
import { createHandler } from "sveltekit-shopify-auth"

const config = {
  accessMode     : AccessMode.OFFLINE,
  keys           : [process.env.SHOPIFY_API_SECRET],
  API_KEY        : process.env.VITE_SHOPIFY_API_KEY,
  API_SECRET_KEY : process.env.SHOPIFY_API_SECRET,
  SCOPES         : process.env.SCOPES.split(","),
  HOST_NAME      : process.env.VITE_SHOPIFY_HOST.replace(/https:\/\//, ""),
  API_VERSION    : ApiVersion.July21,
  IS_EMBEDDED_APP: true,
  LOG_FILE       : "logs/shopify.log",
  SESSION_STORAGE: sessionStorage,
  afterAuth      : async (result: AuthValidationResult) => {
    const { shop, accessToken, scope } = result.session
    const host = result.host

    const shopData: Shop = {
      id       : undefined,
      name     : shop,
      host,
      scope,
      installed: true,
      createdAt: undefined,
      updatedAt: undefined,
    }
    await prisma.shop.upsert({
      where : {
        name: shop,
      },
      update: shopData,
      create: shopData,
    })

    const webhooks = {
      "APP_UNINSTALLED": processAppUninstalled,
      "PRODUCTS_UPDATE": processProductUpdated,
      "PRODUCTS_DELETE": processProductDeleted,
    }

    Object.entries(webhooks).forEach(([webhook, handler]) => {
      Shopify.Webhooks.Registry.addHandler(webhook, {
        path          : "/webhooks",
        webhookHandler: handler,
      })
    })

    const responses: RegisterReturn[] = await Promise.all(Object.keys(webhooks).map(webhook => Shopify.Webhooks.Registry.register(config, {
      shop,
      accessToken,
      path : "/webhooks",
      topic: webhook,
    })))

    responses.flatMap(Object.entries).map(([webhook, res]) => {
      if (!res.success) {
        const message = `Failed to register ${ webhook } webhook: ${ res.result }`
        console.error(message)
      } else {
        console.log(`Registered ${ webhook } successfully`)
      }
    })

    // Redirect to our SvelteKit app 🎉
    return new Response(null, {
      status : 301,
      headers: {
        location: `/?shop=${ shop }&host=${ host }`,
      },
    })
  },
}

export const handle: Handle = async function ({ event, resolve }) {

  const { url } = event
  const shop = url.searchParams.get("shop")

  if (url.pathname === "/") {
    const savedShop = await getShopByName(shop)
    if (!savedShop) {
      return new Response(null, {
        status : 301,
        headers: {
          location: `/auth?shop=${ shop }`,
        },
      })
    }
  }

  if (shop && await getOfflineToken(shop)) {
    // Request online token if we already have an offline token
    config.accessMode = AccessMode.ONLINE
  }

  const authHandler = createHandler(config)

  const authResponse = await authHandler(event)
  if (authResponse) {
    return authResponse
  }

  if (event.url.pathname === "/webhooks") {
    return Shopify.Webhooks.Registry.process(config, event)
  }

  if (event.url.pathname === "/graphql") {
    return Shopify.Utils.graphqlProxy(config, event)
  }

  // if there is a hmac, validate it. Otherwise, validate the bearer token
  if (url.searchParams.get("hmac")) {
    if (!Shopify.Auth.validateHmac(config, event)) {
      return new Response(null, {
        status : 301,
        headers: {
          location: `/auth?shop=${ shop }`,
        },
      })
    }
  } else {
    const response = await verify(config, event)
    if (response) {
      return response
    }
  }

  return resolve(event, {
    ssr: false,
  })
}
