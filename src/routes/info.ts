import type { RequestHandler } from "@sveltejs/kit"

export const get: RequestHandler = async function ({ locals }) {
  // You can read the shop info and the session info from the locals
  const { shop, session } = locals

  return {
    body: {
      shop: {
        createdAt: shop.createdAt,
      },
      // ⚠️ For demo purposes only
      session: {
        expires: session.onlineAccessInfo.expires_in,
      }
    }
  }
}
