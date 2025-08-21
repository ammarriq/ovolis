import type { ScreenSource } from "./types/screen-sources"

import { contextBridge, ipcRenderer } from "electron"

// Expose window controls to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
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

    startRecording: (source) => {
        return ipcRenderer.invoke("start-recording", source)
    },
    saveRecording: (filePath: string, buffer: Uint8Array) => {
        return ipcRenderer.invoke("save-recording", filePath, buffer)
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
