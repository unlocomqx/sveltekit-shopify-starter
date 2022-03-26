import type { RequestHandler } from "@sveltejs/kit"
import { getShopByName } from "../lib/database/models/Shop"

export const get: RequestHandler = async function ({ url }) {
  const shop_name = url.searchParams.get("shop")
  const shop = await getShopByName(shop_name)

  return {
    body: {
      // ⚠️ For demo purposes only, remove sensitive information
      shop: {
        name : shop.name,
        scope: shop.scope,
      }
    }
  }
}
