import { contextBridge, ipcRenderer } from "electron";
// Expose window controls to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
    setWindowSize: (width, height) => {
        return ipcRenderer.invoke("set-window-size", width, height);
    },
    minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
    maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
    closeWindow: () => ipcRenderer.invoke("window-close"),
    closeCamera: () => ipcRenderer.invoke("close-camera"),
    openCamera: (cameraId) => ipcRenderer.invoke("open-camera", cameraId),
    startRecording: (source) => ipcRenderer.invoke("start-recording", source),
    stopRecording: () => ipcRenderer.invoke("stop-recording"),
    getScreenSources: () => {
        return ipcRenderer.invoke("get-screen-sources");
    },
    getDisplayMetrics: (displayId) => {
        return ipcRenderer.invoke("get-display-metrics", displayId);
    },
    resizeWindow: (options) => {
        return ipcRenderer.invoke("resize-window", options);
    },
    focusWindow: (windowTitle) => {
        return ipcRenderer.invoke("focus-window", windowTitle);
    },
    getCameraWindowSourceId: () => {
        return ipcRenderer.invoke("get-camera-source-id");
    },
    // Camera overlay metrics
    updateCameraMetrics: (metrics) => ipcRenderer.send("camera:update-metrics", metrics),
    getCameraMetrics: () => ipcRenderer.invoke("get-camera-metrics"),
    // startRecording: (source: { id: string; name: string }) => {
    //     return ipcRenderer.invoke("start-recording", source)
    // },
    saveRecording: (filePath, buffer) => {
        return ipcRenderer.invoke("save-recording", filePath, buffer);
    },
    openRecordingStream: (filePath) => {
        return ipcRenderer.invoke("open-recording-stream", filePath);
    },
    writeRecordingChunk: (filePath, buffer) => {
        return ipcRenderer.invoke("write-recording-chunk", filePath, buffer);
    },
    closeRecordingStream: (filePath) => {
        return ipcRenderer.invoke("close-recording-stream", filePath);
    },
    finalizeRecordingStream: (filePath) => {
        return ipcRenderer.invoke("finalize-recording-stream", filePath);
    },
    deletePartialRecording: (filePath) => {
        return ipcRenderer.invoke("delete-partial-recording", filePath);
    },
    openFolder: (filePath) => {
        return ipcRenderer.invoke("open-folder", filePath);
    },
    // Exclude app windows from OS-level capture during recording
    setExcludeAppWindowsFromCapture: (enabled) => {
        return ipcRenderer.invoke("set-exclude-app-windows-from-capture", enabled);
    },
    createRecordBar: (config) => {
        return ipcRenderer.invoke("create-record-bar", config);
    },
    closeRecordBar: () => {
        return ipcRenderer.invoke("close-record-bar");
    },
    // Cursor/window helpers for native dragging without app-region
    getCursorPoint: () => ipcRenderer.invoke("get-cursor-point"),
    getCurrentWindowBounds: () => ipcRenderer.invoke("get-current-window-bounds"),
    setCurrentWindowPosition: (x, y) => ipcRenderer.invoke("set-current-window-position", x, y),
    // FFmpeg APIs removed; recordings are saved directly as mp4
});
// Bridge main-process IPC to renderer DOM event for camera overlay window
ipcRenderer.on("camera:selected", (_evt, cameraId) => {
    window.dispatchEvent(new CustomEvent("camera-selected", {
        detail: { cameraId },
    }));
});
// // Keep compatibility with potential record bar flow
// ipcRenderer.on("record-bar:camera-selected", (_evt, cameraId: string) => {
//     window.dispatchEvent(
//         new CustomEvent("camera-selected", {
//             detail: { cameraId },
//         }),
//     )
// })
// Bridge main-process IPC to renderer DOM event for floating bar initialization
ipcRenderer.on("record-bar:config-selected", (_evt, config) => {
    window.dispatchEvent(new CustomEvent("record-config", {
        detail: { config },
    }));
});
//# sourceMappingURL=preload.js.map