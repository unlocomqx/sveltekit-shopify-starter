import { browser } from "$app/env"
import { getApp } from "$lib/shopify/app-bridge"
import { authenticatedFetch as shopifyFetch } from "@shopify/app-bridge-utils"
import { Redirect } from "@shopify/app-bridge/actions/index.js"

export function authenticatedFetch (fetchFn = fetch): (uri: RequestInfo, options?: RequestInit | undefined) => Promise<Response> {
  let shop, host

  if (browser) {
    const urlParams = new URLSearchParams(window.location.search)
    shop = urlParams.get("shop")
    host = urlParams.get("host")
  }

  const app = getApp(shop, host)

  const fetchFunction = shopifyFetch(app, fetchFn)

  return async (uri, options) => {
    console.log(uri)
    const response = await fetchFunction(uri, options)
    console.log(response)
    console.log(response.headers.get("X-Shopify-API-Request-Failure-Reauthorize"))
    if (response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1") {
      const authUrl = response.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url")
      if (window.top === window.self) {
        window.location.assign(`${ import.meta.env.VITE_SHOPIFY_HOST }${ authUrl }`)
      } else {
        Redirect.create(app)
          .dispatch(Redirect.Action.REMOTE, `${ import.meta.env.VITE_SHOPIFY_HOST }${ authUrl }`)
      }
      return null
    }

    return response
  }
}

