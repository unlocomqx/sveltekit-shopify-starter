import { GraphqlClient } from "sveltekit-shopify-api/dist/clients/graphql/index.js"
import type { IShop } from "@interfaces/shop"
import type { Session } from "sveltekit-shopify-api/dist/auth/session"
import { createLogger } from "@utils/logger"
import type { AuthConfig } from "sveltekit-shopify-api"

const log = createLogger("APP:LOCALES")

type ResponseBody<T> = {
  data: T,
  errors: Array<{
    message: string
  }>
};

export async function query<T>(config: AuthConfig, shop: IShop, session: Session, _query): Promise<T> {
  const client = new GraphqlClient(config, shop.name, session.accessToken)
  try {
    const response = await client.query(config, {
      data: _query,
    })
    const body: ResponseBody<T> = response.body as any
    if (body.errors) {
      throw new Error(body.errors[0].message)
    }
    return body.data
  } catch (error) {
    log.error(error)
    throw error
  }
}
