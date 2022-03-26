/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPIFY_API_KEY: string
  readonly VITE_SHOPIFY_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
