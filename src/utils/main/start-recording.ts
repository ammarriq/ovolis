import { desktopCapturer } from "electron"
import { writeFile } from "fs/promises"
import path from "path"
import { app } from "electron"

export async function startHighResRecording(sourceId: string, sourceName: string): Promise<string> {
    try {
        // Get high-resolution screen source
        const sources = await desktopCapturer.getSources({
            types: ["window", "screen"],
            thumbnailSize: { width: 1920, height: 1080 }, // High resolution thumbnail
            fetchWindowIcons: true,
        })

        const targetSource = sources.find(source => source.id === sourceId)
        
        if (!targetSource) {
            throw new Error(`Source with ID ${sourceId} not found`)
        }

        // Create a timestamp for the recording filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `recording-${sourceName.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.webm`
        
        // Get the user's desktop path for saving recordings
        const desktopPath = path.join(app.getPath('desktop'), 'Recrod Recordings')
        const filePath = path.join(desktopPath, filename)

        // Return recording configuration that will be used by the renderer process
        const recordingConfig = {
            sourceId: targetSource.id,
            sourceName: targetSource.name,
            filePath,
            constraints: {
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: targetSource.id
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: targetSource.id,
                        minWidth: 1920,
                        maxWidth: 3840,
                        minHeight: 1080,
                        maxHeight: 2160,
                        minFrameRate: 30,
                        maxFrameRate: 60
                    }
                }
            }
        }

        return JSON.stringify(recordingConfig)
    } catch (error) {
        console.error("Error starting high-res recording:", error)
        throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : String(error)}`)
    }
}

export async function saveRecordingData(filePath: string, buffer: Buffer): Promise<string> {
    try {
        // Ensure the directory exists
        const dir = path.dirname(filePath)
        await import('fs').then(fs => fs.promises.mkdir(dir, { recursive: true }))
        
        // Save the recording file
        await writeFile(filePath, buffer)
        
        return `Recording saved successfully to: ${filePath}`
    } catch (error) {
        console.error("Error saving recording:", error)
        throw new Error(`Failed to save recording: ${error instanceof Error ? error.message : String(error)}`)
    }
}