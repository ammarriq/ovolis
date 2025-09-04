import type { RecordConfig } from "./types/record-config"

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

    createRecordBar: (config: RecordConfig) => {
        return ipcRenderer.invoke("create-record-bar", config)
    },
    closeRecordBar: () => {
        return ipcRenderer.invoke("close-record-bar")
    },

    // FFmpeg APIs removed; recordings are saved directly as mp4
} satisfies Window["electronAPI"])

// Bridge main-process IPC to renderer DOM event for camera overlay window
ipcRenderer.on("camera:selected", (_evt, cameraId: string) => {
    window.dispatchEvent(
        new CustomEvent("camera-selected", {
            detail: { cameraId },
        }),
    )
})

// Keep compatibility with potential record bar flow
ipcRenderer.on("record-bar:camera-selected", (_evt, cameraId: string) => {
    window.dispatchEvent(
        new CustomEvent("camera-selected", {
            detail: { cameraId },
        }),
    )
})

// Bridge main-process IPC to renderer DOM event for floating bar initialization
ipcRenderer.on("record-bar:config-selected", (_evt, config: RecordConfig) => {
    window.dispatchEvent(
        new CustomEvent("record-config", {
            detail: { config },
        }),
    )
})

