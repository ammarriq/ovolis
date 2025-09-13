import type { BrowserWindow } from "electron"

import { desktopCapturer, ipcMain } from "electron"

import { createCamera } from "~/utils/camera"

let cameraWindow: BrowserWindow | null = null
let latestCameraMetrics: {
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
        try {
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
        } catch (e) {
            console.warn("Failed to get camera source id:", e)
            return null
        }
    })

    // Camera overlay metrics: camera window reports, others can query
    ipcMain.on(
        "camera:update-metrics",
        (
            _evt,
            metrics: {
                width: number
                height: number
                radiusPx: number
                dpr: number
            },
        ) => {
            latestCameraMetrics = metrics
        },
    )
    ipcMain.handle("get-camera-metrics", () => latestCameraMetrics)
}
