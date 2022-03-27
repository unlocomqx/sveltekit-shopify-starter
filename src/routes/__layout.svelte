<script lang="ts">
  import { browser } from "$app/env"
  import { page } from "$app/stores"
  import Header from "$lib/components/header/Header.svelte"
  import { initAppBridge } from "$lib/shopify/app-bridge"
  import { authenticatedFetch } from "$lib/shopify/fetch"
  import { onMount } from "svelte"
  import "../app.css"

  // The App Bridge can only work when the app is embedded in Shopify Admin
  // The page will redirect to Shopify Admin when not embedded
  const redirect = browser && window.self === window.top

  if (browser) {
    const query = $page.url.searchParams
    initAppBridge(query.get("shop"), query.get("host"))
  }

  // Will redirect the app to get a new token if the current session is invalid
  onMount(() => authenticatedFetch()("/refresh-shopify-token"))
</script>

{#if redirect}
  <p>Redirecting...</p>
{:else}
  <Header/>

  <main>
    <slot/>
  </main>

  <footer>
    <p>visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit</p>
  </footer>

  <style>
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      width: 100%;
      max-width: 1024px;
      margin: 0 auto;
      box-sizing: border-box;
    }

    footer {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px;
    }

    footer a {
      font-weight: bold;
    }

    @media (min-width: 480px) {
      footer {
        padding: 40px 0;
      }
    }
  </style>
{/if}
