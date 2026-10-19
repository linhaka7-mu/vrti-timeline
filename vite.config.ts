import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves the site from https://linhaka7-mu.github.io/vrti-timeline/,
  // so built files must be linked under /vrti-timeline/. `npm run dev` keeps using the root.
  base: command === 'build' ? '/vrti-timeline/' : '/',
}))
