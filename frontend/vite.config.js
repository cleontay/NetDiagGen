import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves project sites from a /<repo-name>/ subpath; other
// static hosts (Netlify, Vercel, etc.) serve from the root, so this only
// changes when the GH Pages workflow explicitly opts in.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/NetDiagGen/' : '/',
})
