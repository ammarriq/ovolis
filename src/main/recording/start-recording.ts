import { app, desktopCapturer, screen } from "electron"

import { writeFile } from "fs/promises"
import path from "path"

import { fixMp4Metadata } from "./ffmpeg-post.js"

export async function startRecording(sourceId: string, sourceName: string): Promise<string> {
    try {
        const sources = await desktopCapturer.getSources({
            types: ["window", "screen"],
            thumbnailSize: { width: 0, height: 0 },
            fetchWindowIcons: true,
        })

        const targetSource = sources.find((source) => source.id === sourceId)

        if (!targetSource) {
            throw new Error(`Source with ID ${sourceId} not found`)
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const filename = `recording-${sourceName.replace(/[^a-zA-Z0-9]/g, "_")}-${timestamp}.mp4`

        // Save recordings under AppData\\Roaming\\CursorX\\recordings
        const recordingsPath = path.join(app.getPath("appData"), "CursorX", "recordings")
        const filePath = path.join(recordingsPath, filename)

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

