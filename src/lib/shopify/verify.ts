import { prisma } from "$lib/database/client"
import type { RequestEvent } from "@sveltejs/kit/types/private"
import type { AuthConfig } from "sveltekit-shopify-api"
import { Shopify } from "sveltekit-shopify-api"
import { verifyRequest } from "sveltekit-shopify-auth"

export async function verify (config: AuthConfig, event: RequestEvent) {

  const verifyFn = verifyRequest({ returnHeader: true })
  const response = await verifyFn(config, event)
  if (response.status !== 200) {
    return response
  }

  const session = await Shopify.Utils.loadCurrentSession(config, event)
  if (session) {
    event.locals.session = session
    event.locals.shop = await prisma.shop.findUnique({
      where: { name: session.shop },
    })
  }

  return undefined
}
