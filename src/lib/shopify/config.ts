import type { Shop } from "@prisma/client"
import type { AuthValidationResult, RegisterReturn } from "sveltekit-shopify-api"
import { AccessMode, ApiVersion, Shopify } from "sveltekit-shopify-api"
import { prisma } from "../database/client"
import { sessionStorage } from "./session-storage"
import { processAppUninstalled, processProductDeleted, processProductUpdated } from "./webhooks"

export const config = {
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
