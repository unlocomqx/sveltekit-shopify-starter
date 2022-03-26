<script lang="ts">
  import { authenticatedFetch } from "$lib/shopify/fetch"
  import { query } from "$lib/shopify/graphql/client"
  import { gql } from "@apollo/client/core"
  import type { Shop } from "@prisma/client"
  import type { Product, } from "shopify-admin-api-typings"

  export let shop: Shop

  async function getInfos () {
    // Demo for fetch request with Bearer token
    const fetchFn = authenticatedFetch()
    const res = await fetchFn("/info")
    return res.json()
  }

  let infosPromise
  function getMoreInfos () {
    infosPromise = getInfos()
  }


  let productsPromise
  async function getProducts () {
    const _query = gql`{
        products(first: 10) {
          edges {
            node {
              title
              id
            }
          }
        }
      }`

    productsPromise = query<{ products: Product[] }>(_query, {
      fetchPolicy: "no-cache",
    })
  }
</script>

<svelte:head>
  <title>Home</title>
</svelte:head>

<section>
  <h1>
    <div class="welcome">
      <picture>
        <source srcset="svelte-welcome.webp" type="image/webp"/>
        <img src="svelte-welcome.png" alt="Welcome"/>
      </picture>
    </div>

    to your new<br/>SvelteKit app
  </h1>

  <h2>Congrats! Your app works 🎉</h2>

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
    <button on:click={getMoreInfos}>Get more infos (using authenticated fetch)</button>
    <button on:click={getProducts}>Get products (using GraphQL)</button>
  </p>

  {#if infosPromise}
    {#await infosPromise}
      <p>Fetching infos...</p>
    {:then {session, shop}}
      <!-- ⚠️ For demo purposes only -->
      <p>
        The session will expire in ⏳ {session.expires} seconds
      </p>

      <p>
        The app was first installed at ⏰ {new Date(shop.createdAt)}
      </p>
    {/await}
  {/if}

  {#if productsPromise}
    {#await productsPromise}
      <p>Fetching products...</p>
    {:then {products}}
      <ul>
        {#if products.edges.length}
          {#each products.edges as {node: product}}
            <li>{product.title}</li>
          {/each}
        {:else}
          There are no products yet
        {/if}
      </ul>
    {/await}
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
  }

  h1 {
    width: 100%;
  }

  .welcome {
    position: relative;
    width: 100%;
    height: 0;
    padding: 0 0 calc(100% * 495 / 2048) 0;
  }

  .welcome img {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    display: block;
  }
</style>
