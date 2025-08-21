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
            focusWindow: (windowTitle: string) => Promise<string>
            startRecording: (source: {
                id: string
                name: string
            }) => Promise<string>
            saveRecording: (
                filePath: string,
                buffer: Uint8Array
            ) => Promise<string>
            openFolder: (filePath: string) => Promise<void>

            createFloatingBar: (source: ScreenSource) => Promise<void>
            closeFloatingBar: () => Promise<void>
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
