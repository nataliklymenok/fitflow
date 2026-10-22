import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Playwright owns e2e/; Vitest runs the unit tests in src/.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
