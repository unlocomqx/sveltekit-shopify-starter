import { authenticatedFetch } from "$lib/shopify/fetch"
import { HttpLink, InMemoryCache } from "@apollo/client/core"
import { SvelteApolloClient } from "svelte-apollo-client"

const link = new HttpLink({
  uri         : "/graphql",
  fetch       : authenticatedFetch(),
  fetchOptions: {
    credentials: "include",
  },
})

export const client = SvelteApolloClient({
  link,
  cache: new InMemoryCache(),
})

export async function query<T> (q, options = {}): Promise<T> {
  const op = client.query<T>(q, options)

  return new Promise((resolve, reject) => {
    const unsub = op.subscribe(response => {
      if (!response.loading && !response.error) {
        unsub()
        resolve(response.data)
      }
      if (response.error) {
        unsub()
        reject(response.error)
      }
    })
  })
}
