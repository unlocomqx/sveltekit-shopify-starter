# SvelteKit Shopify Starter

A Shopify Starter app based On SvelteKit

![Shopify starter app](./media/screenshot.png)

With concise auth handling code

![Code sample](./media/code-sample.png)

## Contents

- Shopify Auth handler (Provided
  by [sveltekit-shopify-auth](https://github.com/unlocomqx/sveltekit-shopify-auth))
- Shopify webhooks handler
- Shopify GraphQL proxy
- [Shopfiy App bridge](https://shopify.dev/apps/tools/app-bridge)
- Prisma DB (For shop and session storage)

## How to

- Clone it

```shell
git clone https://github.com/unlocomqx/sveltekit-shopify-starter
```

- Install the dependencies

```shell
yarn
```

- Create the `.env` file

```shell
cp .env.sample .env
```

- Initialize the DB

```shell
prisma db push
prisma generate
```

- Run it

```shell
yarn run dev 
# OR serve it with the Shopify cli through ngrok
shopify app serve 
```

ℹ️ Developing with ngrok might be slow, check
this [post](https://dev.to/unlocomqx/a-much-better-dx-for-shopify-apps-38ln) for the best dev
experience

## Usage with SvelteKit hooks

The code in the handle function is minimal

```ts
import type { Handle } from "@sveltejs/kit"
import { handleShopifyAuth } from "$lib/shopify/handler"

export const handle: Handle = async function ({ event, resolve }) {

  const response = await handleShopifyAuth(event)
  if (response) {
    return response
  }

  return resolve(event)
}
```

## Making an authenticated fetch request

To make a `fetch` request that includes a token header, you can call `authenticatedFetch` like so

If the request authentication fails, a redirect is triggered and a new online token is acquired

```ts
import { authenticatedFetch } from "$lib/shopify/fetch"

const fetchFn = authenticatedFetch()
const res = await fetchFn("/info")
const { info } = await res.json()
```

## Making a graphql request

```ts
import { query } from "$lib/shopify/graphql/client"
import { gql } from "@apollo/client/core"
import type { Product, } from "shopify-admin-api-typings"

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

const data = await query<{ product: Product }>(_query, {
  fetchPolicy: "no-cache",
})
```

## Usage with SvelteKit Vercel Adapter

Prisma needs a post install and postbuild for Vercel, and the build command for vercel needs to be
set to `prisma generate` && `npm run build`

```json
"scripts":{
"dev": "svelte-kit dev",
"build": "svelte-kit build",
"package": "svelte-kit package",
"preview": "svelte-kit preview",
"prepare": "svelte-kit sync",
"check": "svelte-check --tsconfig ./tsconfig.json",
"check:watch": "svelte-check --tsconfig ./tsconfig.json --watch",
"postinstall": "prisma generate",
"postbuild": "cp node_modules/@prisma/engines/*query* .vercel_build_output/functions/node/render/;cp prisma/schema.prisma .vercel_build_output/functions/node/render/",
"vercel-build": "prisma generate && npm run build"
}
```
