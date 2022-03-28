import type { AppConfigV1, AppConfigV2, ClientApplication } from "@shopify/app-bridge"
import AppBridge from "@shopify/app-bridge"
import { Redirect } from "@shopify/app-bridge/actions"

// @ts-ignore
const createApp = typeof AppBridge === "function" ? AppBridge : AppBridge.default

export function initAppBridge (shop: string, host: string) {
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY
  const redirectUri = `${ import.meta.env.VITE_SHOPIFY_HOST }/auth/callback`
  const permissionUrl = `https://${ shop }/admin/oauth/authorize?client_id=${ apiKey }&scope=read_products,read_content&redirect_uri=${ redirectUri }`

  if (host) {
    // Redirect to the app page if the app is already authorized
    createApp({
      apiKey       : import.meta.env.VITE_SHOPIFY_API_KEY,
      host,
      forceRedirect: true,
    })
  } else {
    // If the current window is the 'parent', change the URL by setting location.href
    if (window.top === window.self) {
      window.location.assign(permissionUrl)
    } else {
      // If the current window is the 'child',
      // change the parent's URL with Shopify App Bridge's Redirect action
      const app = createApp({
        apiKey: apiKey,
        host  : host,
      })

      Redirect.create(app).dispatch(Redirect.Action.REMOTE, permissionUrl)
    }
  }
}

export function getApp (shop = null, host = null): ClientApplication<any> {
  if (!shop || !host) {
    const params = new URLSearchParams(location.search)
    shop = params.get("shop")
    host = params.get("host")
  }

  return createApp({
    apiKey       : import.meta.env.VITE_SHOPIFY_API_KEY,
    shopOrigin   : shop,
    host,
    forceRedirect: false,
  } as AppConfigV1 & AppConfigV2)
}
