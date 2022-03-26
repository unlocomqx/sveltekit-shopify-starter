import { prisma } from "$lib/database/client"
import type { RequestEvent } from "@sveltejs/kit/types/private"
import type { AuthConfig } from "sveltekit-shopify-api"
import loadCurrentSession from "sveltekit-shopify-api/dist/utils/load-current-session"
import { verifyRequest } from "sveltekit-shopify-auth"

export async function verify (config: AuthConfig, event: RequestEvent) {

  const verifyFn = verifyRequest({ returnHeader: true })
  const response = await verifyFn(config, event)
  if (response.status !== 200) {
    return response
  }

  const session = await loadCurrentSession(config, event)
  if (session) {
    event.locals.session = session
    event.locals.shop = await prisma.shop.findUnique({
      where: { name: session.shop },
    })
  }

  return undefined
}
