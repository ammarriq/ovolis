import type { QualityPreset } from "../types/ffmpeg.js"

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
    high: {
        name: "High Quality",
        videoCodec: "libx264",
        audioCodec: "aac",
        audioBitrate: "192k",
        crf: 23, // ROBUST: Balanced quality for compatibility
        preset: "medium", // ROBUST: Better compatibility than fast
        pixelFormat: "yuv420p",
        additionalFlags: [
            "-f",
            "mp4", // FORCE: Explicit MP4 format
            "-movflags",
            "+faststart+frag_keyframe+empty_moov",
            "-strict",
            "experimental", // COMPATIBILITY: Handle edge cases
            "-max_muxing_queue_size",
            "1024", // BUFFER: Prevent sync issues
            "-analyzeduration",
            "2147483647", // ANALYZE: Full input analysis
            "-probesize",
            "2147483647", // PROBE: Complete stream detection
        ],
    },
    medium: {
        name: "Medium Quality",
        videoCodec: "libx264",
        audioCodec: "aac",
        audioBitrate: "128k",
        crf: 26, // ROBUST: Balanced quality for compatibility
        preset: "medium", // ROBUST: Better compatibility than fast
        pixelFormat: "yuv420p",
        additionalFlags: [
            "-f",
            "mp4", // FORCE: Explicit MP4 format
            "-movflags",
            "+faststart+frag_keyframe+empty_moov",
            "-strict",
            "experimental", // COMPATIBILITY: Handle edge cases
            "-max_muxing_queue_size",
            "1024", // BUFFER: Prevent sync issues
            "-analyzeduration",
            "2147483647", // ANALYZE: Full input analysis
            "-probesize",
            "2147483647", // PROBE: Complete stream detection
        ],
    },
    low: {
        name: "Low Quality",
        videoCodec: "libx264",
        audioCodec: "aac",
        audioBitrate: "96k",
        crf: 30,
        preset: "fast", // ROBUST: Faster but still compatible
        pixelFormat: "yuv420p",
        additionalFlags: [
            "-f",
            "mp4", // FORCE: Explicit MP4 format
            "-movflags",
            "+faststart+frag_keyframe+empty_moov",
            "-strict",
            "experimental", // COMPATIBILITY: Handle edge cases
            "-max_muxing_queue_size",
            "1024", // BUFFER: Prevent sync issues
            "-analyzeduration",
            "2147483647", // ANALYZE: Full input analysis
            "-probesize",
            "2147483647", // PROBE: Complete stream detection
        ],
    },
}

export const DEFAULT_PRESET = "high"

export function buildFFmpegArgs(
    inputPath: string,
    outputPath: string,
    preset: QualityPreset
): string[] {
    const args = [
        "-i",
        inputPath,
        "-c:v",
        preset.videoCodec,
        "-c:a",
        preset.audioCodec,
        "-b:a",
        preset.audioBitrate,
    ]

    // Add CRF for quality control
    if (preset.crf !== undefined) {
        args.push("-crf", preset.crf.toString())
    }

    // Add preset for encoding speed/quality balance
    if (preset.preset) {
        args.push("-preset", preset.preset)
    }

    // Add pixel format
    if (preset.pixelFormat) {
        args.push("-pix_fmt", preset.pixelFormat)
    }

    // Add video bitrate if specified
    if (preset.videoBitrate) {
        args.push("-b:v", preset.videoBitrate)
    }

    // Add additional flags
    if (preset.additionalFlags) {
        args.push(...preset.additionalFlags)
    }

    // Add progress reporting
    args.push("-progress", "pipe:1")

    // Overwrite output file
    args.push("-y")

    // Output path
    args.push(outputPath)

    return args
}

export function getPresetByName(presetName: string): QualityPreset {
    return QUALITY_PRESETS[presetName] || QUALITY_PRESETS[DEFAULT_PRESET]
}

export function getAllPresets(): QualityPreset[] {
    return Object.values(QUALITY_PRESETS)
}
