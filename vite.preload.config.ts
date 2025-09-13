import path from "path"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

// Vite config for Electron preload script
export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "src"),
        },
    },
})
