import { app, desktopCapturer } from "electron"

import { writeFile } from "fs/promises"
import path from "path"

import { fileProcessor } from "./file-processor.js"

export async function startRecording(
    sourceId: string,
    sourceName: string
): Promise<string> {
    try {
        // Get high-resolution screen source with maximum quality
        const sources = await desktopCapturer.getSources({
            types: ["window", "screen"],
            thumbnailSize: { width: 1920, height: 1080 }, // 4K resolution thumbnail
            fetchWindowIcons: true,
        })

        const targetSource = sources.find((source) => source.id === sourceId)

        if (!targetSource) {
            throw new Error(`Source with ID ${sourceId} not found`)
        }

        // Create a timestamp for the recording filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const filename = `recording-${sourceName.replace(/[^a-zA-Z0-9]/g, "_")}-${timestamp}.mp4`

        // Get the user's desktop path for saving recordings
        const desktopPath = path.join(
            app.getPath("desktop"),
            "Recrod Recordings"
        )
        const filePath = path.join(desktopPath, filename)

        // Return recording configuration that will be used by the renderer process
        const recordingConfig = {
            sourceId: targetSource.id,
            sourceName: targetSource.name,
            filePath,
            constraints: {
                audio: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: targetSource.id,
                    },
                },
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: targetSource.id,
                        cursor: "always", // Always show cursor for consistent visibility
                        minWidth: 1280,
                        maxWidth: 1920, // Further reduced to prevent WGC errors
                        minHeight: 720,
                        maxHeight: 1080, // Further reduced to prevent WGC errors
                        minFrameRate: 24,
                        maxFrameRate: 30, // Moderate frame rate to reduce system load
                        // Add cursor-specific optimizations
                        googCpuOveruseDetection: false, // Disable CPU overuse detection for smoother cursor
                        googNoiseReduction: false, // Disable noise reduction for better cursor clarity
                    },
                },
            },
        }

        console.log("=== RECORDING CONSTRAINTS DIAGNOSTICS ===")
        console.log("Recording constraints:", recordingConfig.constraints)
        console.log(
            "✅ Using 30-60fps target for smoother cursor and motion - FIXED"
        )
        console.log(
            "Note: Capped at 1080p to avoid WGC capture stability issues"
        )
        console.log("Source info:", {
            id: targetSource.id,
            name: targetSource.name,
            displayId: targetSource.display_id,
        })

        return JSON.stringify(recordingConfig)
    } catch (error) {
        console.error("Error starting high-res recording:", error)
        throw new Error(
            `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

export async function saveRecording(
    filePath: string,
    buffer: Buffer
): Promise<string> {
    try {
        // Ensure the directory exists
        const dir = path.dirname(filePath)
        await import("fs").then((fs) =>
            fs.promises.mkdir(dir, { recursive: true })
        )

        // Create temporary WebM file path
        const tempWebmPath = filePath.replace(".mp4", "_temp.webm")

        // Save the WebM recording file first
        await writeFile(tempWebmPath, buffer)
        console.log(`WebM file saved temporarily to: ${tempWebmPath}`)

        // Process the recording with FFmpeg conversion
        const processingResult = await fileProcessor.processRecording({
            inputPath: tempWebmPath,
            outputPath: filePath,
            presetName: "high", // Use high quality preset
            keepOriginal: false, // Delete the temporary WebM file after conversion
            onProgress: (progress) => {
                console.log("Conversion progress:", progress)
            },
            onComplete: (outputPath) => {
                console.log("Conversion completed:", outputPath)
            },
            onError: (error) => {
                console.error("Conversion error:", error)
            },
        })

        if (processingResult.success) {
            const message = processingResult.fallbackUsed
                ? `Recording saved (WebM format) to: ${processingResult.outputPath}`
                : `Recording converted and saved to: ${processingResult.outputPath}`

            console.log(message)
            return message
        } else {
            throw new Error(
                processingResult.error || "Failed to process recording"
            )
        }
    } catch (error) {
        console.error("Error saving recording:", error)

        // Clean up any temporary files
        try {
            await fileProcessor.cleanup()
        } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError)
        }

        throw new Error(
            `Failed to save recording: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

export async function saveRecordingWithoutConversion(
    filePath: string,
    buffer: Buffer
): Promise<string> {
    try {
        // Ensure the directory exists
        const dir = path.dirname(filePath)
        await import("fs").then((fs) =>
            fs.promises.mkdir(dir, { recursive: true })
        )

        // Save the recording file directly (fallback method)
        await writeFile(filePath, buffer)

        return `Recording saved successfully to: ${filePath}`
    } catch (error) {
        console.error("Error saving recording:", error)
        throw new Error(
            `Failed to save recording: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}
