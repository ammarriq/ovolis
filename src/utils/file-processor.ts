import type { ConversionProgress } from "../types/ffmpeg.js"

import fs from "fs/promises"
import path from "path"

import { DEFAULT_PRESET, getPresetByName } from "./ffmpeg-config.js"
import { ffmpegManager } from "./ffmpeg-manager.js"
import { progressReporter } from "./progress-reporter.js"

export interface ProcessingConfig {
    inputPath: string
    outputPath: string
    presetName?: string
    keepOriginal?: boolean
    onProgress?: (progress: ConversionProgress) => void
    onComplete?: (outputPath: string) => void
    onError?: (error: string) => void
}

export interface ProcessingResult {
    success: boolean
    outputPath?: string
    error?: string
    fallbackUsed?: boolean
}

export class FileProcessor {
    private static instance: FileProcessor
    private tempFiles: Set<string> = new Set()

    private constructor() {}

    public static getInstance(): FileProcessor {
        if (!FileProcessor.instance) {
            FileProcessor.instance = new FileProcessor()
        }
        return FileProcessor.instance
    }

    public async processRecording(
        config: ProcessingConfig
    ): Promise<ProcessingResult> {
        try {
            console.log("Starting file processing:", {
                input: config.inputPath,
                output: config.outputPath,
                preset: config.presetName || DEFAULT_PRESET,
            })

            // Check if input file exists
            try {
                await fs.access(config.inputPath)
            } catch (_error) {
                throw new Error(`Input file not found: ${config.inputPath}`)
            }

            // Check if FFmpeg is available
            const isFFmpegAvailable =
                await ffmpegManager.checkFFmpegAvailability()
            if (!isFFmpegAvailable) {
                console.warn("FFmpeg not available, using WebM fallback")
                return await this.handleFallback(config)
            }

            // Get quality preset
            const preset = getPresetByName(config.presetName || DEFAULT_PRESET)

            // Create temporary output path for conversion
            const tempOutputPath = this.generateTempPath(config.outputPath)
            this.tempFiles.add(tempOutputPath)

            // Start progress reporting
            progressReporter.startConversion()

            try {
                // Perform FFmpeg conversion
                const result = await ffmpegManager.convertVideo({
                    inputPath: config.inputPath,
                    outputPath: tempOutputPath,
                    preset,
                    onProgress: (progress: ConversionProgress) => {
                        progressReporter.updateProgress(progress)
                        if (config.onProgress) {
                            config.onProgress(progress)
                        }
                    },
                    onComplete: (outputPath: string) => {
                        console.log("FFmpeg conversion completed:", outputPath)
                    },
                    onError: (error: string) => {
                        console.error("FFmpeg conversion error:", error)
                    },
                })

                if (result.success && result.outputPath) {
                    // Move temp file to final location
                    await this.moveFile(tempOutputPath, config.outputPath)
                    this.tempFiles.delete(tempOutputPath)

                    // Clean up original file if requested
                    if (!config.keepOriginal) {
                        await this.safeDeleteFile(config.inputPath)
                    }

                    progressReporter.completeConversion(config.outputPath)

                    if (config.onComplete) {
                        config.onComplete(config.outputPath)
                    }

                    return {
                        success: true,
                        outputPath: config.outputPath,
                    }
                } else {
                    throw new Error(result.error || "FFmpeg conversion failed")
                }
            } catch (conversionError) {
                console.error(
                    "Conversion failed, attempting fallback:",
                    conversionError
                )

                // Clean up temp file
                await this.safeDeleteFile(tempOutputPath)
                this.tempFiles.delete(tempOutputPath)

                // Try fallback
                return await this.handleFallback(config)
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            console.error("File processing error:", errorMessage)

            progressReporter.errorConversion(errorMessage)

            if (config.onError) {
                config.onError(errorMessage)
            }

            return {
                success: false,
                error: errorMessage,
            }
        }
    }

    private async handleFallback(
        config: ProcessingConfig
    ): Promise<ProcessingResult> {
        try {
            console.log("Using WebM fallback - copying original file")

            // Simply copy the WebM file to the output location
            // The original file is already WebM but was saved with .mp4 extension
            await this.copyFile(config.inputPath, config.outputPath)

            // Clean up original file if requested and it's different from output
            if (
                !config.keepOriginal &&
                config.inputPath !== config.outputPath
            ) {
                await this.safeDeleteFile(config.inputPath)
            }

            progressReporter.completeConversion(config.outputPath)

            if (config.onComplete) {
                config.onComplete(config.outputPath)
            }

            return {
                success: true,
                outputPath: config.outputPath,
                fallbackUsed: true,
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            console.error("Fallback processing error:", errorMessage)

            progressReporter.errorConversion(errorMessage)

            if (config.onError) {
                config.onError(errorMessage)
            }

            return {
                success: false,
                error: errorMessage,
            }
        }
    }

    private generateTempPath(originalPath: string): string {
        const dir = path.dirname(originalPath)
        const ext = path.extname(originalPath)
        const name = path.basename(originalPath, ext)
        const timestamp = Date.now()
        return path.join(dir, `${name}_temp_${timestamp}${ext}`)
    }

    private async moveFile(
        sourcePath: string,
        destPath: string
    ): Promise<void> {
        try {
            // Ensure destination directory exists
            const destDir = path.dirname(destPath)
            await fs.mkdir(destDir, { recursive: true })

            // Move file
            await fs.rename(sourcePath, destPath)
            console.log(`File moved from ${sourcePath} to ${destPath}`)
        } catch (error) {
            console.error("Error moving file:", error)
            // If rename fails, try copy and delete
            await this.copyFile(sourcePath, destPath)
            await this.safeDeleteFile(sourcePath)
        }
    }

    private async copyFile(
        sourcePath: string,
        destPath: string
    ): Promise<void> {
        try {
            // Ensure destination directory exists
            const destDir = path.dirname(destPath)
            await fs.mkdir(destDir, { recursive: true })

            // Copy file
            await fs.copyFile(sourcePath, destPath)
            console.log(`File copied from ${sourcePath} to ${destPath}`)
        } catch (error) {
            console.error("Error copying file:", error)
            throw error
        }
    }

    private async safeDeleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath)
            console.log(`File deleted: ${filePath}`)
        } catch (error) {
            console.warn(`Could not delete file ${filePath}:`, error)
            // Don't throw - deletion failure shouldn't break the process
        }
    }

    public async cleanup(): Promise<void> {
        console.log("Cleaning up temporary files...")

        const cleanupPromises = Array.from(this.tempFiles).map(
            async (filePath) => {
                await this.safeDeleteFile(filePath)
                this.tempFiles.delete(filePath)
            }
        )

        await Promise.all(cleanupPromises)

        // Reset progress reporter
        progressReporter.resetState()
    }

    public cancelProcessing(): void {
        console.log("Cancelling file processing...")

        // Cancel FFmpeg conversion
        ffmpegManager.cancelConversion()

        // Update progress reporter
        progressReporter.cancelConversion()

        // Clean up temp files (async, don't wait)
        this.cleanup().catch((error) => {
            console.error("Error during cleanup:", error)
        })
    }

    public getTempFileCount(): number {
        return this.tempFiles.size
    }
}

// Export singleton instance
export const fileProcessor = FileProcessor.getInstance()
