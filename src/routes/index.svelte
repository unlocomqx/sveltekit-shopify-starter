<script lang="ts">
  import { authenticatedFetch } from "$lib/shopify/fetch"
  import type { Shop } from "@prisma/client"
  import type { Session } from "sveltekit-shopify-api/dist/auth/session"

  export let shop: Shop

  let sessionInfo: Session
  let shopInfo: Shop
  async function getInfo () {
    // Demo for fetch request with Bearer token
    const fetchFn = authenticatedFetch()
    const res = await fetchFn("/info")
    const { session, shop } = await res.json()
    sessionInfo = session
    shopInfo = shop
  }

  let promise
  function handleClick () {
    promise = getInfo()
  }
</script>

<p>Congrats! Your app works 🎉</p>

<ul>
  <li>The current shop is <strong>{shop.name}</strong></li>
  <li>
    The app scopes are
    <ul>
      {#each shop.scope.split(",") as scope}
        <li>{scope}</li>
      {/each}
    </ul>
  </li>
</ul>

<p>
  <button on:click={handleClick}>Get more info</button>
</p>

{#if promise}
  {#await promise}
    Fetching info...
  {:then _}
    <!-- ⚠️ For demo purposes only -->
    <p>
      The session will expire in ⏳ {sessionInfo.expires} seconds
    </p>

    <p>
      The app was first installed at ⏰ {new Date(shopInfo.createdAt)}
    </p>
  {/await}
{/if}
