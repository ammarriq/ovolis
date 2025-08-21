import type { ConversionProgress, QualityPreset } from "~/types/ffmpeg"
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

            // FFmpeg operations
            ffmpegCheckAvailability: () => Promise<boolean>
            ffmpegGetPresets: () => Promise<QualityPreset[]>
            ffmpegConvertVideo: (config: {
                inputPath: string
                outputPath: string
                presetName: string
            }) => Promise<{ success: boolean; outputPath?: string }>
            ffmpegCancelConversion: () => Promise<{ success: boolean }>
            // Streaming APIs
            ffmpegStreamStart: (config: {
                outputPath: string
                presetName: string
                inputFormat?: string
            }) => Promise<{ success: boolean; sessionId: string }>
            ffmpegStreamWrite: (
                sessionId: string,
                chunk: Uint8Array
            ) => Promise<{ success: boolean; ok: boolean }>
            ffmpegStreamStop: (
                sessionId: string
            ) => Promise<{ success: boolean; outputPath?: string; error?: string }>
            ffmpegStreamCancel: (
                sessionId?: string
            ) => Promise<{ success: boolean }>
            onFFmpegProgress: (
                callback: (progress: ConversionProgress) => void
            ) => void
            removeFFmpegProgressListener: () => void
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
