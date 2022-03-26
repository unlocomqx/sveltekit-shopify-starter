<script lang="ts">
  import { browser } from "$app/env"
  import { page } from "$app/stores"
  import { initAppBridge } from "$lib/shopify/app-bridge"

  // The App Bridge can only work when the app is embedded in Shopify Admin
  // The page will redirect to Shopify Admin when not embedded
  const redirect = browser && window.self === window.top

  if (browser) {
    const query = $page.url.searchParams
    initAppBridge(query.get("shop"), query.get("host"))
  }

</script>

{#if redirect}
  Redirecting...
{:else}
  <slot></slot>
{/if}
