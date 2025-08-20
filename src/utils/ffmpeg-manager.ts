import type {
    ConversionProgress,
    FFmpegConfig,
    FFmpegResult,
} from "../types/ffmpeg.js"
import type { ChildProcess } from "child_process"

import { app } from "electron"

import { spawn } from "child_process"
import fs from "fs/promises"
import path from "path"

import { buildFFmpegArgs } from "./ffmpeg-config.js"

export class FFmpegManager {
    private static instance: FFmpegManager
    private activeProcesses: Map<string, ChildProcess> = new Map()
    private ffmpegPath: string

    private constructor() {
        // Resolve FFmpeg binary path
        this.ffmpegPath = this.getFFmpegPath()
    }

    public static getInstance(): FFmpegManager {
        if (!FFmpegManager.instance) {
            FFmpegManager.instance = new FFmpegManager()
        }
        return FFmpegManager.instance
    }

    private getFFmpegPath(): string {
        const isDev = process.env.NODE_ENV === "development"

        if (isDev) {
            // In development, use the binary from the project root
            return path.join(process.cwd(), "binaries", "ffmpeg.exe")
        } else {
            // In production, use the binary from the app resources
            const resourcesPath = process.resourcesPath || app.getAppPath()
            return path.join(resourcesPath, "binaries", "ffmpeg.exe")
        }
    }

    public async checkFFmpegAvailability(): Promise<boolean> {
        try {
            await fs.access(this.ffmpegPath)
            return true
        } catch (_error) {
            console.error("FFmpeg binary not found at:", this.ffmpegPath)
            return false
        }
    }

    public async convertVideo(config: FFmpegConfig): Promise<FFmpegResult> {
        const processId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        try {
            // Check if FFmpeg is available
            const isAvailable = await this.checkFFmpegAvailability()
            if (!isAvailable) {
                throw new Error("FFmpeg binary not found")
            }

            // ROBUST: Pre-process and validate input file
            console.log("=== INPUT VALIDATION & REPAIR ===")
            const validatedInput = await this.validateAndRepairInput(
                config.inputPath
            )

            // Build FFmpeg arguments with validated input
            const args = buildFFmpegArgs(
                validatedInput,
                config.outputPath,
                config.preset
            )

            console.log("=== FFMPEG PROCESSING DIAGNOSTICS ===")
            console.log("Starting FFmpeg conversion:", {
                input: config.inputPath,
                output: config.outputPath,
                preset: config.preset.name,
                crf: config.preset.crf,
                preset_speed: config.preset.preset,
                args: args.join(" "),
            })
            console.log("✅ Robust conversion mode enabled!")
            console.log("✅ Input validation and repair completed!")
            console.log("Robust flags: +faststart, +frag_keyframe, +empty_moov")

            const startTime = Date.now()

            // Spawn FFmpeg process
            const ffmpegProcess = spawn(this.ffmpegPath, args, {
                stdio: ["pipe", "pipe", "pipe"],
            })

            this.activeProcesses.set(processId, ffmpegProcess)

            return new Promise((resolve, reject) => {
                let progressData = ""
                let errorData = ""

                // Handle progress output
                ffmpegProcess.stdout?.on("data", (data: Buffer) => {
                    progressData += data.toString()

                    // Parse progress information
                    const progress = this.parseProgress(progressData)
                    if (progress && config.onProgress) {
                        config.onProgress(progress)
                    }
                })

                // Handle error output
                ffmpegProcess.stderr?.on("data", (data: Buffer) => {
                    errorData += data.toString()
                    console.log("FFmpeg stderr:", data.toString())
                })

                // Handle process completion
                ffmpegProcess.on("close", (code) => {
                    this.activeProcesses.delete(processId)

                    if (code === 0) {
                        const processingTime = (Date.now() - startTime) / 1000
                        console.log("=== FFMPEG COMPLETION DIAGNOSTICS ===")
                        console.log("FFmpeg conversion completed successfully")
                        console.log(
                            `Processing time: ${processingTime.toFixed(2)} seconds`
                        )
                        if (processingTime > 30) {
                            console.log(
                                "WARNING: Processing took longer than 30 seconds - SLOW PROCESSING DETECTED!"
                            )
                        }

                        // Post-process to ensure duration metadata is written
                        this.ensureDurationMetadata(config.outputPath)
                            .then(() => {
                                console.log(
                                    "✅ Duration metadata verification completed"
                                )
                            })
                            .catch((error) => {
                                console.warn(
                                    "Duration metadata verification failed:",
                                    error
                                )
                            })

                        const _result: FFmpegResult = {
                            success: true,
                            outputPath: config.outputPath,
                        }

                        if (config.onComplete) {
                            config.onComplete(config.outputPath)
                        }

                        resolve(_result)
                    } else {
                        const error = `FFmpeg process exited with code ${code}: ${errorData}`
                        console.error("FFmpeg conversion failed:", error)

                        const _result: FFmpegResult = {
                            success: false,
                            error,
                        }

                        if (config.onError) {
                            config.onError(error)
                        }

                        reject(new Error(error))
                    }
                })

                // Handle process errors
                ffmpegProcess.on("error", (error) => {
                    this.activeProcesses.delete(processId)
                    console.error("FFmpeg process error:", error)

                    const _result: FFmpegResult = {
                        success: false,
                        error: error.message,
                    }

                    if (config.onError) {
                        config.onError(error.message)
                    }

                    reject(error)
                })
            })
        } catch (error) {
            console.error("Error starting FFmpeg conversion:", error)
            const result: FFmpegResult = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            }

            if (config.onError) {
                config.onError(result.error!)
            }

            throw error
        }
    }

    private parseProgress(data: string): ConversionProgress | null {
        try {
            const lines = data.split("\n")
            const progressInfo: Partial<ConversionProgress> = {}

            for (const line of lines) {
                const [key, value] = line.split("=")
                if (!key || !value) continue

                switch (key.trim()) {
                    case "frame":
                        progressInfo.frame = parseInt(value)
                        break
                    case "fps":
                        progressInfo.fps = parseFloat(value)
                        break
                    case "bitrate":
                        progressInfo.bitrate = value.trim()
                        break
                    case "total_size":
                        progressInfo.totalSize = value.trim()
                        break
                    case "out_time_us":
                        progressInfo.outTimeUs = parseInt(value)
                        break
                    case "out_time_ms":
                        progressInfo.outTimeMs = parseInt(value)
                        break
                    case "out_time":
                        progressInfo.outTime = value.trim()
                        break
                    case "dup_frames":
                        progressInfo.dupFrames = parseInt(value)
                        break
                    case "drop_frames":
                        progressInfo.dropFrames = parseInt(value)
                        break
                    case "speed":
                        progressInfo.speed = parseFloat(value.replace("x", ""))
                        break
                    case "progress":
                        progressInfo.progress = value.trim()
                        break
                }
            }

            // Calculate percentage if we have time information
            if (progressInfo.outTimeMs && progressInfo.outTimeMs > 0) {
                // This is a rough estimation - in a real implementation,
                // you'd need to know the total duration of the input video
                progressInfo.percentage = Math.min(
                    100,
                    (progressInfo.outTimeMs / 1000 / 60) * 10
                )
            }

            // Return progress only if we have meaningful data
            if (
                progressInfo.frame !== undefined ||
                progressInfo.progress === "continue"
            ) {
                return progressInfo as ConversionProgress
            }

            return null
        } catch (error) {
            console.error("Error parsing FFmpeg progress:", error)
            return null
        }
    }

    public cancelConversion(processId?: string): void {
        if (processId && this.activeProcesses.has(processId)) {
            const process = this.activeProcesses.get(processId)
            process?.kill("SIGTERM")
            this.activeProcesses.delete(processId)
        } else {
            // Cancel all active processes
            for (const [id, process] of this.activeProcesses) {
                process.kill("SIGTERM")
                this.activeProcesses.delete(id)
            }
        }
    }

    public getActiveProcessCount(): number {
        return this.activeProcesses.size
    }

    public cleanup(): void {
        this.cancelConversion()
    }

    private async ensureDurationMetadata(videoPath: string): Promise<void> {
        try {
            console.log("=== DURATION METADATA VERIFICATION ===")

            // Use FFprobe to check if duration metadata exists
            const probeArgs = [
                "-v",
                "quiet",
                "-show_entries",
                "format=duration",
                "-of",
                "csv=p=0",
                videoPath,
            ]

            const ffprobeProcess = spawn(
                this.ffmpegPath.replace("ffmpeg.exe", "ffprobe.exe"),
                probeArgs,
                {
                    stdio: ["pipe", "pipe", "pipe"],
                }
            )

            return new Promise((resolve, reject) => {
                let output = ""
                let errorOutput = ""

                ffprobeProcess.stdout?.on("data", (data: Buffer) => {
                    output += data.toString()
                })

                ffprobeProcess.stderr?.on("data", (data: Buffer) => {
                    errorOutput += data.toString()
                })

                ffprobeProcess.on("close", async (code) => {
                    if (code === 0) {
                        const duration = parseFloat(output.trim())
                        console.log(
                            `Video duration detected: ${duration} seconds`
                        )

                        if (duration && duration > 0) {
                            console.log(
                                "✅ Duration metadata is present and valid"
                            )
                            resolve()
                        } else {
                            console.log(
                                "⚠️ Duration metadata missing, attempting to fix..."
                            )
                            await this.fixDurationMetadata(videoPath)
                            resolve()
                        }
                    } else {
                        console.warn("FFprobe failed:", errorOutput)
                        // Try to fix anyway
                        await this.fixDurationMetadata(videoPath)
                        resolve()
                    }
                })

                ffprobeProcess.on("error", (error) => {
                    console.warn("FFprobe error:", error)
                    // Try to fix anyway
                    this.fixDurationMetadata(videoPath)
                        .then(resolve)
                        .catch(reject)
                })
            })
        } catch (error) {
            console.warn("Duration verification error:", error)
            throw error
        }
    }

    private async fixDurationMetadata(videoPath: string): Promise<void> {
        try {
            console.log("Fixing duration metadata for:", videoPath)

            const tempPath = videoPath.replace(".mp4", "_duration_fix.mp4")

            // Re-encode with explicit duration calculation
            const fixArgs = [
                "-i",
                videoPath,
                "-c",
                "copy", // Copy streams without re-encoding
                "-map_metadata",
                "0", // Copy metadata
                "-movflags",
                "+faststart",
                "-avoid_negative_ts",
                "make_zero",
                "-fflags",
                "+genpts",
                "-y", // Overwrite
                tempPath,
            ]

            const fixProcess = spawn(this.ffmpegPath, fixArgs, {
                stdio: ["pipe", "pipe", "pipe"],
            })

            return new Promise((resolve, reject) => {
                let errorOutput = ""

                fixProcess.stderr?.on("data", (data: Buffer) => {
                    errorOutput += data.toString()
                })

                fixProcess.on("close", async (code) => {
                    if (code === 0) {
                        try {
                            // Replace original with fixed version
                            await fs.rename(tempPath, videoPath)
                            console.log(
                                "✅ Duration metadata fixed successfully"
                            )
                            resolve()
                        } catch (renameError) {
                            console.error(
                                "Failed to replace file:",
                                renameError
                            )
                            reject(renameError)
                        }
                    } else {
                        console.error("Duration fix failed:", errorOutput)
                        // Clean up temp file
                        try {
                            await fs.unlink(tempPath)
                        } catch {}
                        reject(
                            new Error(`Duration fix failed with code ${code}`)
                        )
                    }
                })

                fixProcess.on("error", (error) => {
                    console.error("Duration fix process error:", error)
                    reject(error)
                })
            })
        } catch (error) {
            console.error("Duration fix error:", error)
            throw error
        }
    }

    private async validateAndRepairInput(inputPath: string): Promise<string> {
        try {
            console.log("Validating input file:", inputPath)

            // Check if input file exists and is readable
            try {
                await fs.access(inputPath)
                const stats = await fs.stat(inputPath)
                console.log(
                    `Input file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
                )

                if (stats.size === 0) {
                    throw new Error("Input file is empty")
                }
            } catch (error) {
                throw new Error(`Input file validation failed: ${error}`)
            }

            // Create a repaired version of the input
            const repairedPath = inputPath.replace(".webm", "_repaired.webm")

            console.log("Repairing input file structure...")

            // Repair WebM file structure and ensure proper metadata
            const repairArgs = [
                "-i",
                inputPath,
                "-c",
                "copy", // Copy streams without re-encoding
                "-avoid_negative_ts",
                "make_zero",
                "-fflags",
                "+genpts",
                "-map_metadata",
                "-1", // Remove problematic metadata
                "-f",
                "webm", // Force WebM format
                "-y", // Overwrite
                repairedPath,
            ]

            const repairProcess = spawn(this.ffmpegPath, repairArgs, {
                stdio: ["pipe", "pipe", "pipe"],
            })

            return new Promise((resolve, _reject) => {
                let errorOutput = ""

                repairProcess.stderr?.on("data", (data: Buffer) => {
                    errorOutput += data.toString()
                })

                repairProcess.on("close", async (code) => {
                    if (code === 0) {
                        try {
                            // Verify the repaired file
                            const repairedStats = await fs.stat(repairedPath)
                            if (repairedStats.size > 0) {
                                console.log(
                                    "✅ Input file repaired successfully"
                                )
                                resolve(repairedPath)
                            } else {
                                console.warn(
                                    "Repaired file is empty, using original"
                                )
                                await fs.unlink(repairedPath).catch(() => {})
                                resolve(inputPath)
                            }
                        } catch (error) {
                            console.warn(
                                "Failed to verify repaired file, using original:",
                                error
                            )
                            resolve(inputPath)
                        }
                    } else {
                        console.warn(
                            "Input repair failed, using original file:",
                            errorOutput
                        )
                        // Clean up failed repair file
                        try {
                            await fs.unlink(repairedPath)
                        } catch {}
                        resolve(inputPath)
                    }
                })

                repairProcess.on("error", (error) => {
                    console.warn(
                        "Input repair process error, using original:",
                        error
                    )
                    resolve(inputPath)
                })
            })
        } catch (error) {
            console.warn("Input validation error, using original file:", error)
            return inputPath
        }
    }
}

// Export singleton instance
export const ffmpegManager = FFmpegManager.getInstance()
