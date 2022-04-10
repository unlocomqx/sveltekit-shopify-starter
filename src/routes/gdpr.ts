import { config } from "$lib/shopify/config"
import { processCustomersDataRequest, processCustomersRedact, processShopRedact } from "$lib/shopify/webhooks"
import type { RequestHandler } from "@sveltejs/kit"
import { Shopify } from "sveltekit-shopify-api"

Shopify.Webhooks.Registry.addHandlers({
  "CUSTOMERS_DATA_REQUEST": {
    path          : "/gdpr",
    webhookHandler: processCustomersDataRequest,
  },
  "CUSTOMERS_REDACT"      : {
    path          : "/gdpr",
    webhookHandler: processCustomersRedact,
  },
  "SHOP_REDACT"           : {
    path          : "/gdpr",
    webhookHandler: processShopRedact,
  },
})

export const post: RequestHandler = async function (event) {
  try {
    return await Shopify.Webhooks.Registry.process(config, event)
  } catch (e) {
    return new Response("Access denied!", {
      status: 401,
    })
  }
}
