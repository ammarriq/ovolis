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
            "+faststart", // Final files should not be fragmented; keep moov at front
            "-max_muxing_queue_size",
            "1024", // BUFFER: Prevent sync issues
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
            "+faststart", // Final files should not be fragmented; keep moov at front
            "-max_muxing_queue_size",
            "1024", // BUFFER: Prevent sync issues
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
            "+faststart", // Final files should not be fragmented; keep moov at front
            "-max_muxing_queue_size",
            "1024", // BUFFER: Prevent sync issues
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
    // For streaming, avoid fragmented MP4 and heavy probing flags; use faststart only
    args.push("-movflags", "+faststart")
    // Avoid negative timestamps that can break seeking in some players
    args.push("-avoid_negative_ts", "make_zero")

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

// Build args for streaming input via stdin (e.g., WebM from MediaRecorder)
export function buildFFmpegArgsFromStdin(
    outputPath: string,
    preset: QualityPreset,
    inputFormat: string = "webm"
): string[] {
    const args = [
        "-f",
        inputFormat, // input container coming from MediaRecorder
        "-fflags",
        "+genpts", // generate missing PTS for live input
        "-use_wallclock_as_timestamps",
        "1", // use wallclock for timestamps for realtime chunks
        "-analyzeduration",
        "0", // do not wait to analyze live input
        "-probesize",
        "32k", // small probe size for quick start
        "-i",
        "pipe:0", // read from stdin
        "-c:v",
        preset.videoCodec,
        "-c:a",
        preset.audioCodec,
        "-b:a",
        preset.audioBitrate,
        // Better seeking: regular keyframes every ~1s for smoother cursor playback
        "-force_key_frames",
        "expr:gte(t,n_forced*1)",
    ]

    if (preset.crf !== undefined) {
        args.push("-crf", preset.crf.toString())
    }
    if (preset.preset) {
        args.push("-preset", preset.preset)
    }
    if (preset.pixelFormat) {
        args.push("-pix_fmt", preset.pixelFormat)
    }
    if (preset.videoBitrate) {
        args.push("-b:v", preset.videoBitrate)
    }
    if (preset.additionalFlags) {
        args.push(...preset.additionalFlags)
    }

    // Progress and overwrite
    args.push("-progress", "pipe:1")
    args.push("-y")
    args.push(outputPath)

    return args
}
