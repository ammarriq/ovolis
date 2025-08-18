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
            startHighResRecording: (
                sourceId: string,
                sourceName: string
            ) => Promise<string>
            saveRecordingData: (
                filePath: string,
                buffer: Uint8Array
            ) => Promise<string>
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
