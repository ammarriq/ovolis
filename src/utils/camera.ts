import type { RecordConfig } from "~/types/record-config"

import { BrowserWindow, screen } from "electron"

import path from "path"

export function createCamera(cameraId: RecordConfig["selectedCameraId"]): BrowserWindow {
    // Desired window size
    const windowWidth = 216
    const windowHeight = 216

    // Calculate bottom-center position on the primary display's work area
    const { workArea } = screen.getPrimaryDisplay()
    const margin = 12 // small offset from the very bottom
    const x = Math.round(workArea.x + (workArea.width - windowWidth) - margin)
    const y = Math.round(workArea.y + workArea.height - windowHeight - margin)

    const cameraWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x,
        y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        show: false,
        resizable: false,
        skipTaskbar: true,
        movable: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    cameraWindow.setMenuBarVisibility(false)

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        const filePath = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/app.camera.html`
        cameraWindow.loadURL(filePath)
    } else {
        const filePath = `../renderer/${MAIN_WINDOW_VITE_NAME}/app.camera.html`
        cameraWindow.loadFile(path.join(__dirname, filePath))
    }

    // Send source data to floating window when ready
    cameraWindow.webContents.once("did-finish-load", () => {
        // Safer than executeJavaScript: use IPC to notify renderer
        if (!cameraWindow.isDestroyed()) {
            cameraWindow.webContents.send("camera:selected", cameraId)
        }
        // Show after the content is ready to avoid white flash on spawn
        if (!cameraWindow.isDestroyed()) {
            cameraWindow.show()
        }
    })

    return cameraWindow
}
