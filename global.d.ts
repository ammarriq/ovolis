import type { RecordConfig } from "~/types/record-config"
import type { ScreenSource } from "~/types/screen-sources"

// Declare electron API types
declare global {
    interface Window {
        electronAPI: {
            setWindowSize: (width?: number, height?: number) => Promise<void>
            minimizeWindow: () => Promise<void>
            maximizeWindow: () => Promise<void>
            closeWindow: () => Promise<void>
            closeCamera: () => Promise<void>
            openCamera: (cameraId?: string) => Promise<void>
            stopRecording: () => Promise<void>

            getScreenSources: () => Promise<ScreenSource[]>
            getDisplayMetrics: (
                displayId?: string,
            ) => Promise<{ width: number; height: number; displayId: string }>
            resizeWindow: (options: {
                appName: string
                width: number
                height: number
            }) => Promise<void>
            focusWindow: (windowTitle: string) => Promise<string>
            startRecording: (source: { id: string; name: string }) => Promise<string>
            saveRecording: (filePath: string, buffer: Uint8Array) => Promise<string>
            openRecordingStream: (filePath: string) => Promise<string>
            writeRecordingChunk: (filePath: string, buffer: Uint8Array) => Promise<void>
            closeRecordingStream: (filePath: string) => Promise<void>
            finalizeRecordingStream: (filePath: string) => Promise<string>
            deletePartialRecording: (filePath: string) => Promise<void>
            openFolder: (filePath: string) => Promise<void>

            createRecordBar: (config: RecordConfig) => Promise<void>
            closeRecordBar: () => Promise<void>
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

// Allow importing image assets in TS/TSX (Vite will bundle and emit URLs)
declare module "*.png" {
    const src: string
    export default src
}
declare module "*.jpg" {
    const src: string
    export default src
}
declare module "*.jpeg" {
    const src: string
    export default src
}
declare module "*.svg" {
    const src: string
    export default src
}
