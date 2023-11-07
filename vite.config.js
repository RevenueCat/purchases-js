import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: "es2015",
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: "RCBilling",
      formats: ["umd", "iife", "es"]
    }
  }
})