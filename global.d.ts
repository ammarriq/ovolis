import type { ScreenSource } from "~/types/screen-sources"

// Declare electron API types
declare global {
    interface Window {
        electronAPI: {
            minimizeWindow: () => Promise<void>
            maximizeWindow: () => Promise<void>
            closeWindow: () => Promise<void>

            getScreenSources: () => Promise<ScreenSource[]>
            resizeWindow: (options: {
                appName: string
                width: number
                height: number
            }) => Promise<void>
        }
    }
}

// Global React JSX style attribute enhancement
declare module "react" {
    interface CSSProperties {
        WebkitAppRegion?: "drag" | "no-drag"
    }
}

export {}
