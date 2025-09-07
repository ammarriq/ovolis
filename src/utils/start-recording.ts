import { app, desktopCapturer, screen } from "electron"

import { writeFile } from "fs/promises"
import path from "path"

import { fixMp4Metadata } from "./ffmpeg-post.js"

export async function startRecording(sourceId: string, sourceName: string): Promise<string> {
    try {
        // Get high-resolution screen source with maximum quality
        const sources = await desktopCapturer.getSources({
            types: ["window", "screen"],
            // Thumbnail not used for sizing; keep minimal
            thumbnailSize: { width: 0, height: 0 },
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
        const desktopPath = path.join(app.getPath("desktop"), "CursorX Recordings")
        const filePath = path.join(desktopPath, filename)

        // Try to force exact pixel dimensions for screen capture.
        // For window capture, omit width/height so Chromium uses native size.
        let exactWidth: number | undefined
        let exactHeight: number | undefined

        if (targetSource.display_id && targetSource.display_id !== "") {
            const displays = screen.getAllDisplays()
            const display = displays.find((d) => d.id.toString() === targetSource.display_id)
            if (display) {
                // Convert DIP to physical pixels via scaleFactor
                exactWidth = Math.round(display.size.width * display.scaleFactor)
                exactHeight = Math.round(display.size.height * display.scaleFactor)
            }
        }

        // Return recording configuration that will be used by the renderer process
        const recordingConfig = {
            sourceId: targetSource.id,
            sourceName: targetSource.name,
            filePath,
            constraints: {
                // Enable system/desktop audio; we'll mix with mic in the renderer
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
                        cursor: "always",
                        // If we know exact screen size, force exact match
                        ...(exactWidth && exactHeight
                            ? {
                                  minWidth: exactWidth,
                                  maxWidth: exactWidth,
                                  minHeight: exactHeight,
                                  maxHeight: exactHeight,
                              }
                            : {}),
                        minFrameRate: 30,
                        maxFrameRate: 60,
                        // Keep WebRTC processing minimal for fidelity
                        googCpuOveruseDetection: false,
                        googNoiseReduction: false,
                        googEchoCancellation: false,
                        googAutoGainControl: false,
                        googHighpassFilter: false,
                        googTypingNoiseDetection: false,
                    },
                },
            },
        }

        console.log("=== RECORDING CONSTRAINTS DIAGNOSTICS ===")
        console.log("Recording constraints:", recordingConfig.constraints)
        if (exactWidth && exactHeight) {
            console.log("Forcing exact screen dimensions:", {
                width: exactWidth,
                height: exactHeight,
            })
        } else {
            console.log("Window capture: using source's native size (no scaling).")
        }
        console.log("✅ Targeting up to 4K@60 if available; will fall back gracefully.")
        console.log("Source info:", {
            id: targetSource.id,
            name: targetSource.name,
            displayId: targetSource.display_id,
        })

        return JSON.stringify(recordingConfig)
    } catch (error) {
        console.error("Error starting high-res recording:", error)
        throw new Error(
            `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

export async function saveRecording(filePath: string, buffer: Buffer): Promise<string> {
    try {
        // Ensure the directory exists
        const dir = path.dirname(filePath)
        await import("fs").then((fs) => fs.promises.mkdir(dir, { recursive: true }))

        // Save the recording file directly (mp4)
        await writeFile(filePath, buffer)

        // Post-process with ffmpeg to fix metadata and enable faststart
        const fixedPath = await fixMp4Metadata(filePath)

        const message = `Recording saved successfully to: ${fixedPath}`
        console.log(message)
        return message
    } catch (error) {
        console.error("Error saving recording:", error)
        throw new Error(
            `Failed to save recording: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

export async function saveRecordingWithoutConversion(
    filePath: string,
    buffer: Buffer,
): Promise<string> {
    try {
        // Ensure the directory exists
        const dir = path.dirname(filePath)
        await import("fs").then((fs) => fs.promises.mkdir(dir, { recursive: true }))

        // Save the recording file directly (fallback method)
        await writeFile(filePath, buffer)

        return `Recording saved successfully to: ${filePath}`
    } catch (error) {
        console.error("Error saving recording:", error)
        throw new Error(
            `Failed to save recording: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}
