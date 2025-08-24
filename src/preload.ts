import type { ScreenSource } from "./types/screen-sources"

import { contextBridge, ipcRenderer } from "electron"

// Expose window controls to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
    setWindowSize: (width: number, height: number) => {
        return ipcRenderer.invoke("set-window-size", width, height)
    },
    minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
    maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
    closeWindow: () => ipcRenderer.invoke("window-close"),

    getScreenSources: () => {
        return ipcRenderer.invoke("get-screen-sources")
    },
    resizeWindow: (options) => {
        return ipcRenderer.invoke("resize-window", options)
    },
    focusWindow: (windowTitle: string) => {
        return ipcRenderer.invoke("focus-window", windowTitle)
    },

    startRecording: (source: { id: string; name: string }) => {
        return ipcRenderer.invoke("start-recording", source)
    },
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

    createFloatingBar: (source: ScreenSource) => {
        return ipcRenderer.invoke("create-floating-bar", source)
    },
    closeFloatingBar: () => {
        return ipcRenderer.invoke("close-floating-bar")
    },

    // FFmpeg APIs removed; recordings are saved directly as mp4
} satisfies Window["electronAPI"])
