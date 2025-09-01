import type { ScreenSource } from "./types/screen-sources"

import { contextBridge, ipcRenderer } from "electron"

// Expose window controls to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
    setWindowSize: (width?: number, height?: number) => {
        return ipcRenderer.invoke("set-window-size", width, height)
    },
    minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
    maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
    closeWindow: () => ipcRenderer.invoke("window-close"),
    startRecording: (source: { id: string; name: string }) =>
        ipcRenderer.invoke("start-recording", source),
    stopRecording: () => ipcRenderer.invoke("stop-recording"),

    getScreenSources: () => {
        return ipcRenderer.invoke("get-screen-sources")
    },
    getDisplayMetrics: (displayId?: string) => {
        return ipcRenderer.invoke("get-display-metrics", displayId)
    },
    resizeWindow: (options) => {
        return ipcRenderer.invoke("resize-window", options)
    },
    focusWindow: (windowTitle: string) => {
        return ipcRenderer.invoke("focus-window", windowTitle)
    },

    // startRecording: (source: { id: string; name: string }) => {
    //     return ipcRenderer.invoke("start-recording", source)
    // },
    saveRecording: (filePath: string, buffer: Uint8Array) => {
        return ipcRenderer.invoke("save-recording", filePath, buffer)
    },
    openRecordingStream: (filePath: string) => {
        return ipcRenderer.invoke("open-recording-stream", filePath)
    },
    writeRecordingChunk: (filePath: string, buffer: Uint8Array) => {
        return ipcRenderer.invoke("write-recording-chunk", filePath, buffer)
    },
    closeRecordingStream: (filePath: string) => {
        return ipcRenderer.invoke("close-recording-stream", filePath)
    },
    finalizeRecordingStream: (filePath: string) => {
        return ipcRenderer.invoke("finalize-recording-stream", filePath)
    },
    deletePartialRecording: (filePath: string) => {
        return ipcRenderer.invoke("delete-partial-recording", filePath)
    },
    openFolder: (filePath: string) => {
        return ipcRenderer.invoke("open-folder", filePath)
    },

    createRecordBar: (source: ScreenSource) => {
        return ipcRenderer.invoke("create-record-bar", source)
    },
    closeRecordBar: () => {
        return ipcRenderer.invoke("close-record-bar")
    },

    // FFmpeg APIs removed; recordings are saved directly as mp4
} satisfies Window["electronAPI"])

// Bridge main-process IPC to renderer DOM event for floating bar initialization
ipcRenderer.on("record-bar:source-selected", (_evt, source: ScreenSource) => {
    window.dispatchEvent(
        new CustomEvent("source-selected", {
            detail: { source },
        }),
    )
})
