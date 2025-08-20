import type { QualityPreset } from "../types/ffmpeg.js"

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
    high: {
        name: "High Quality",
        videoCodec: "libx264",
        audioCodec: "aac",
        audioBitrate: "192k",
        crf: 20, // IMPROVED: Reduced from 18 for faster processing
        preset: "fast", // IMPROVED: Changed from "medium" for speed
        pixelFormat: "yuv420p",
        additionalFlags: [
            "-hwaccel",
            "auto", // ADDED: Hardware acceleration
            "-movflags",
            "+faststart+write_colr",
            "-tune",
            "zerolatency", // ADDED: For faster encoding
            "-avoid_negative_ts",
            "make_zero", // FIX: Ensure proper timestamps
            "-fflags",
            "+genpts+igndts", // FIX: Generate PTS and ignore DTS issues
            "-vsync",
            "cfr", // FIX: Constant frame rate for proper duration
            "-r",
            "25", // FIX: Explicit frame rate for duration calculation
        ],
    },
    medium: {
        name: "Medium Quality",
        videoCodec: "libx264",
        audioCodec: "aac",
        audioBitrate: "128k",
        crf: 24, // IMPROVED: Slightly increased for faster processing
        preset: "fast", // IMPROVED: Changed from "medium" for speed
        pixelFormat: "yuv420p",
        additionalFlags: [
            "-hwaccel",
            "auto", // ADDED: Hardware acceleration
            "-movflags",
            "+faststart+write_colr",
            "-tune",
            "zerolatency", // ADDED: For faster encoding
            "-avoid_negative_ts",
            "make_zero", // FIX: Ensure proper timestamps
            "-fflags",
            "+genpts+igndts", // FIX: Generate PTS and ignore DTS issues
            "-vsync",
            "cfr", // FIX: Constant frame rate for proper duration
            "-r",
            "25", // FIX: Explicit frame rate for duration calculation
        ],
    },
    low: {
        name: "Low Quality",
        videoCodec: "libx264",
        audioCodec: "aac",
        audioBitrate: "96k",
        crf: 28,
        preset: "ultrafast", // IMPROVED: Changed from "fast" for maximum speed
        pixelFormat: "yuv420p",
        additionalFlags: [
            "-hwaccel",
            "auto", // ADDED: Hardware acceleration
            "-movflags",
            "+faststart+write_colr",
            "-tune",
            "zerolatency", // ADDED: For faster encoding
            "-avoid_negative_ts",
            "make_zero", // FIX: Ensure proper timestamps
            "-fflags",
            "+genpts+igndts", // FIX: Generate PTS and ignore DTS issues
            "-vsync",
            "cfr", // FIX: Constant frame rate for proper duration
            "-r",
            "25", // FIX: Explicit frame rate for duration calculation
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
