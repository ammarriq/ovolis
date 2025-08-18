import { contextBridge, ipcRenderer } from "electron"

// Expose window controls to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
    minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
    maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
    closeWindow: () => ipcRenderer.invoke("window-close"),

    getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
    resizeWindow: (options: {
        appName: string
        width: number
        height: number
    }) => ipcRenderer.invoke("resize-window", options),
    focusWindow: (windowTitle: string) =>
        ipcRenderer.invoke("focus-window", windowTitle),
    startHighResRecording: (sourceId: string, sourceName: string) =>
        ipcRenderer.invoke("start-high-res-recording", sourceId, sourceName),
    saveRecordingData: (filePath: string, buffer: Buffer) =>
        ipcRenderer.invoke("save-recording-data", filePath, buffer),
})
