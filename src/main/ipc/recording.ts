import type { ScreenSource } from "~/types/screen-sources"

import { ipcMain } from "electron"

import { fixMp4Metadata } from "~/utils/ffmpeg-post"
import {
    closeRecordingStream,
    deletePartialRecording,
    finalizeRecordingStream,
    openRecordingStream,
    writeRecordingChunk,
} from "~/utils/recording-stream"
import { saveRecording, startRecording } from "~/utils/start-recording"

export function registerRecordingIpc() {
    // recording options
    ipcMain.handle("start-recording", (_evt, source: Pick<ScreenSource, "id" | "name">) => {
        return startRecording(source.id, source.name)
    })

    ipcMain.handle("save-recording", async (_evt, filePath: string, uint8Array: Uint8Array) => {
        const buffer = Buffer.from(uint8Array)
        return await saveRecording(filePath, buffer)
    })

    // Streaming save APIs
    ipcMain.handle("open-recording-stream", async (_evt, filePath: string): Promise<string> => {
        return await openRecordingStream(filePath)
    })

    ipcMain.handle(
        "write-recording-chunk",
        async (_evt, filePath: string, uint8Array: Uint8Array): Promise<void> => {
            const buffer = Buffer.from(uint8Array)
            return await writeRecordingChunk(filePath, buffer)
        },
    )

    ipcMain.handle("close-recording-stream", async (_evt, filePath: string): Promise<void> => {
        return await closeRecordingStream(filePath)
    })

    ipcMain.handle("finalize-recording-stream", async (_evt, filePath: string): Promise<string> => {
        const finalized = await finalizeRecordingStream(filePath)
        // Run ffmpeg post-process to fix metadata / faststart
        const fixed = await fixMp4Metadata(finalized)
        return fixed
    })

    ipcMain.handle("delete-partial-recording", async (_evt, filePath: string): Promise<void> => {
        return await deletePartialRecording(filePath)
    })
}

