import { handleShopifyAuth } from "$lib/shopify/handler"
import type { Handle } from "@sveltejs/kit"

export const handle: Handle = async function ({ event, resolve }) {

  const response = await handleShopifyAuth(event)
  if (response) {
    return response
  }

  return resolve(event, {
    ssr: false,
  })
}
