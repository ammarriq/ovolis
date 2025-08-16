import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config
export default defineConfig({
    plugins: [tailwindcss(), tsconfigPaths()],
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "src"),
        },
    },
    base: "./",
})
