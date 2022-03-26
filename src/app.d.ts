/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces
declare namespace App {

  import type { Shop } from "@prisma/client"
  import type { Session } from "sveltekit-shopify-api/dist/auth/session"

  interface Locals {
    shop: Shop
    session: Session
  }

}

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_SHOPIFY_API_KEY: string
    SHOPIFY_API_SECRET: string
    SCOPES: string
    VITE_SHOPIFY_HOST: string

    DATABASE_URL: string
  }
}
