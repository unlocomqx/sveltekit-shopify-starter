import adapter from "@sveltejs/adapter-auto"
import preprocess from "svelte-preprocess"

/** @type {import("@sveltejs/kit").Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    adapter: adapter(),

    vite: {
      server: {
        hmr: {
          // Necessary to avoid issues with https
          host: "localhost",
          protocol: "ws",
        },
      },
    }
  }
}

export default config
