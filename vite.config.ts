import solid from "solid-start/vite";
import vercel from 'solid-start-vercel'
import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    solid({
      adapter: vercel({edge:false}),
    }),
    nodePolyfills()
  ],
  ssr: {
    external: ['fs']
  },  
})