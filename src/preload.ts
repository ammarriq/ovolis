import { contextBridge, ipcRenderer } from "electron"

// Expose window controls to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
    minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
    maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
    closeWindow: () => ipcRenderer.invoke("window-close"),

    getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
})
