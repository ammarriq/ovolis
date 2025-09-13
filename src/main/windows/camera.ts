import { BrowserWindow, desktopCapturer, ipcMain, screen } from "electron"

import path from "path"

import { tryCatch } from "~/utils/try-catch"

function createCamera(cameraId?: string): BrowserWindow {
    // Desired window size
    const windowWidth = 216
    const windowHeight = 216

    // Calculate bottom-right position on the primary display's work area
    const { workArea } = screen.getPrimaryDisplay()
    const margin = 12 // small offset from the very bottom-right
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

let cameraWindow: BrowserWindow | null = null
let cameraMetrics: {
    width: number
    height: number
    radiusPx: number
    dpr: number
} | null = null

export function registerCameraIpc() {
    ipcMain.handle("open-camera", (_evt, cameraId?: string) => {
        if (!cameraWindow) {
            cameraWindow = createCamera(cameraId)
            cameraWindow.on("closed", () => {
                cameraWindow = null
            })
        } else if (!cameraWindow.isDestroyed()) {
            cameraWindow.webContents.send("camera:selected", cameraId)
            cameraWindow.show()
            cameraWindow.focus()
        }
    })

    ipcMain.handle("close-camera", () => {
        if (cameraWindow) {
            cameraWindow.close()
            cameraWindow = null
        }
    })

    // Provide the source id of the Camera window for efficient PiP compositing
    ipcMain.handle("get-camera-source-id", async () => {
        const { data, error } = await tryCatch(async () => {
            if (!cameraWindow || cameraWindow.isDestroyed()) return null
            const cameraTitle = cameraWindow.getTitle() || "Camera"
            const sources = await desktopCapturer.getSources({
                types: ["window"],
                fetchWindowIcons: false,
                thumbnailSize: { width: 1, height: 1 },
            })
            
            const match = sources.find(
                (s) => (s.name || "").toLowerCase() === cameraTitle.toLowerCase(),
            )

            return match?.id ?? null
        })

        if (error) {
            console.warn("Failed to get camera source id:", error)
            return null
        }

        return data
    })

    ipcMain.on("camera:update-metrics", (_, m: typeof cameraMetrics) => (cameraMetrics = m))
    ipcMain.handle("get-camera-metrics", () => cameraMetrics)
}
