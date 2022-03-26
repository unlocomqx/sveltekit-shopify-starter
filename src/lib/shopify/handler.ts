import { getOfflineToken } from "$lib/database/models/OfflineSession"
import { getShopByName } from "$lib/database/models/Shop"
import type { RequestEvent } from "@sveltejs/kit/types/private"
import { AccessMode, Shopify } from "sveltekit-shopify-api"
import { createHandler } from "sveltekit-shopify-auth"
import { config } from "./config"
import { verify } from "./verify"

export async function handleShopifyAuth (event: RequestEvent) {
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
}
