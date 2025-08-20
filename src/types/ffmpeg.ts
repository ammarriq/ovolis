export interface FFmpegConfig {
    inputPath: string
    outputPath: string
    preset: QualityPreset
    onProgress?: (progress: ConversionProgress) => void
    onComplete?: (outputPath: string) => void
    onError?: (error: string) => void
}

export interface QualityPreset {
    name: string
    videoCodec: string
    audioCodec: string
    videoBitrate?: string
    audioBitrate: string
    crf?: number
    preset?: string
    pixelFormat?: string
    additionalFlags?: string[]
}

export interface ConversionProgress {
    frame: number
    fps: number
    bitrate: string
    totalSize: string
    outTimeUs: number
    outTimeMs: number
    outTime: string
    dupFrames: number
    dropFrames: number
    speed: number
    progress: string
    percentage: number
}

export interface FFmpegResult {
    success: boolean
    outputPath?: string
    error?: string
    duration?: number
}

export interface FFmpegProcessInfo {
    pid: number
    inputPath: string
    outputPath: string
    startTime: number
    preset: QualityPreset
}

export type ConversionStatus =
    | "idle"
    | "converting"
    | "completed"
    | "error"
    | "cancelled"

export interface ConversionState {
    status: ConversionStatus
    progress?: ConversionProgress
    error?: string
    outputPath?: string
    startTime?: number
    estimatedTimeRemaining?: number
}
