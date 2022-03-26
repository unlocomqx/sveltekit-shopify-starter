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

    productsPromise = query<{ product: Product }>(_query, {
      fetchPolicy: "no-cache",
    })
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
  <button on:click={getMoreInfos}>Get more infos (using authenticated fetch)</button>
  <button on:click={getProducts}>Get products (using GraphQL)</button>
</p>

{#if infosPromise}
  {#await infosPromise}
    Fetching infos...
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
    Fetching products...
  {:then {products}}
    <ul>
      {#each products.edges as {node: product}}
        <li>{product.title}</li>
      {/each}
    </ul>
  {/await}
{/if}
