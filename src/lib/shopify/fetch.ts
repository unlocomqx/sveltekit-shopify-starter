import { browser } from "$app/env"
import { getApp } from "$lib/shopify/app-bridge"
import { authenticatedFetch as shopifyFetch } from "@shopify/app-bridge-utils"
import { Redirect } from "@shopify/app-bridge/actions/index.js"

function authenticatedFetch (fetchFn = fetch): (uri: RequestInfo, options?: RequestInit | undefined) => Promise<Response> {
  let shop, host

  if (browser) {
    const urlParams = new URLSearchParams(window.location.search)
    shop = urlParams.get("shop")
    host = urlParams.get("host")
  }

  const app = getApp(shop, host)

  const fetchFunction = shopifyFetch(app, fetchFn)

  return async (uri, options) => {
    const response = await fetchFunction(uri, options)

    if (response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1") {
      const authUrlHeader = response.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url")
      console.log(authUrlHeader)
      if (window.top === window.self) {
        window.location.assign(`${ import.meta.env.VITE_SHOPIFY_HOST }/auth?shop=${ shop }`)
      } else {
        Redirect.create(app)
          .dispatch(Redirect.Action.REMOTE, `${ import.meta.env.VITE_SHOPIFY_HOST }/auth?shop=${ shop }`)
      }
      return null
    }

    return response
  }
}

