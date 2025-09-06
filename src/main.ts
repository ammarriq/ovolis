import type { RecordConfig } from "./types/record-config"
import type { ScreenSource } from "./types/screen-sources"

import { app, BrowserWindow, desktopCapturer, ipcMain, screen, shell } from "electron"
import started from "electron-squirrel-startup"

import path from "path"

import { createCamera } from "./utils/camera"
import { fixMp4Metadata } from "./utils/ffmpeg-post"
import { createRecordBar } from "./utils/record-bar"
import {
    closeRecordingStream,
    deletePartialRecording,
    finalizeRecordingStream,
    openRecordingStream,
    writeRecordingChunk,
} from "./utils/recording-stream"
import { saveRecording, startRecording } from "./utils/start-recording"
import { takeScreenshot } from "./utils/take-screenshots"
import { focusWindow, resizeWindow } from "./utils/window-manager"

const DEFAULT_WIDTH = 280
const DEFAULT_HEIGHT = 354

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit()
}

function getIconPath(): string {
    const isDev = !app.isPackaged
    // Resolve from project root in dev; from resources in production
    if (isDev) {
        if (process.platform === "win32") {
            return path.join(process.cwd(), "src/assets/icons/icon.ico")
        } else if (process.platform === "darwin") {
            return path.join(process.cwd(), "src/assets/icons/icon.icns")
        } else {
            return path.join(process.cwd(), "src/assets/icons/icon.png")
        }
    } else {
        // We copy `src/assets/icons` into resources as `icons/`
        if (process.platform === "win32") {
            return path.join(process.resourcesPath, "icons", "icon.ico")
        } else if (process.platform === "darwin") {
            return path.join(process.resourcesPath, "icons", "icon.icns")
        } else {
            return path.join(process.resourcesPath, "icons", "icon.png")
        }
    }
}

// Global window references
let mainWindow: BrowserWindow | null = null
let floatingWindow: BrowserWindow | null = null
let cameraWindow: BrowserWindow | null = null
let latestCameraMetrics:
    | {
          x: number
          y: number
          width: number
          height: number
          radiusPx: number
          dpr: number
          windowWidth: number
          windowHeight: number
      }
    | null = null

// Global cursor/window helpers available to any renderer
ipcMain.handle("get-cursor-point", () => {
    return screen.getCursorScreenPoint()
})
ipcMain.handle("get-current-window-bounds", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return win?.getBounds()
})
ipcMain.handle("set-current-window-position", (event, x: number, y: number) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || win.isDestroyed()) return
    win.setPosition(Math.round(x), Math.round(y))
})

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        minWidth: DEFAULT_WIDTH,
        minHeight: DEFAULT_HEIGHT,
        frame: false,
        transparent: true,
        titleBarStyle: "hidden",
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: getIconPath(),
    })

    // camera devtools (optional)
    // cameraWindow = createCamera("camera")
    // cameraWindow.webContents.openDevTools({
    //     mode: "undocked",
    // })

    mainWindow.setMenuBarVisibility(false)

    // window actions
    ipcMain.handle("set-window-size", (_, width?: number, height?: number) => {
        if (!mainWindow) return

        const newWidth = width ?? DEFAULT_WIDTH
        const newHeight = height ?? DEFAULT_HEIGHT

        mainWindow.setMinimumSize(newWidth, newHeight)
        mainWindow.setSize(newWidth, newHeight)
    })

    ipcMain.handle("window-close", () => {
        if (mainWindow) mainWindow.close()
        if (floatingWindow) floatingWindow.close()
        if (cameraWindow) cameraWindow.close()
    })

    ipcMain.handle("open-camera", (_evt, cameraId?: string) => {
        if (!cameraWindow) {
            cameraWindow = createCamera(cameraId)
            cameraWindow.on("closed", () => {
                cameraWindow = null
            })
            cameraWindow.webContents.openDevTools({
                mode: "undocked",
            })
        } else {
            if (!cameraWindow.isDestroyed()) {
                cameraWindow.webContents.send("camera:selected", cameraId)
                cameraWindow.show()
                cameraWindow.focus()
            }
        }
    })

    ipcMain.handle("close-camera", () => {
        if (cameraWindow) {
            cameraWindow.close()
            cameraWindow = null
        }
    })

    ipcMain.handle("window-minimize", () => {
        if (mainWindow) mainWindow.minimize()
    })

    ipcMain.handle("window-maximize", () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) mainWindow.unmaximize()
            else mainWindow.maximize()
        }
    })

    // window manager actions
    ipcMain.handle("get-screen-sources", takeScreenshot)
    ipcMain.handle("resize-window", resizeWindow)
    ipcMain.handle("focus-window", focusWindow)

    // display metrics
    ipcMain.handle("get-display-metrics", (_evt, displayId?: string) => {
        const displays = screen.getAllDisplays()
        const display =
            displays.find((d) => d.id.toString() === displayId) ?? //
            screen.getPrimaryDisplay()

        const { width, height } = display.workAreaSize
        return { width, height, displayId: display.id.toString() }
    })

    // floating bar actions
    ipcMain.handle("create-record-bar", async (_, config: RecordConfig) => {
        if (floatingWindow) floatingWindow.close()

        floatingWindow = createRecordBar(config)
        floatingWindow.on("closed", () => {
            floatingWindow = null
        })

        if (mainWindow) mainWindow.close()

        return { success: true }
    })

    ipcMain.handle("close-record-bar", () => {
        if (floatingWindow) {
            floatingWindow.close()
            floatingWindow = null
        }
    })

    ipcMain.handle("open-folder", async (_, filePath: string) => {
        const folderPath = path.dirname(filePath)
        await shell.openPath(folderPath)
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
                x: number
                y: number
                width: number
                height: number
                radiusPx: number
                dpr: number
                windowWidth: number
                windowHeight: number
            },
        ) => {
            latestCameraMetrics = metrics
        },
    )
    ipcMain.handle("get-camera-metrics", () => latestCameraMetrics)

    // recording options
    ipcMain.handle("start-recording", (_, source: Pick<ScreenSource, "id" | "name">) => {
        return startRecording(source.id, source.name)
    })

    ipcMain.handle("save-recording", async (_, filePath: string, uint8Array: Uint8Array) => {
        const buffer = Buffer.from(uint8Array)
        return await saveRecording(filePath, buffer)
    })

    // Streaming save APIs
    ipcMain.handle("open-recording-stream", async (_, filePath: string): Promise<string> => {
        return await openRecordingStream(filePath)
    })

    ipcMain.handle(
        "write-recording-chunk",
        async (_, filePath: string, uint8Array: Uint8Array): Promise<void> => {
            const buffer = Buffer.from(uint8Array)
            return await writeRecordingChunk(filePath, buffer)
        },
    )

    ipcMain.handle("close-recording-stream", async (_, filePath: string): Promise<void> => {
        return await closeRecordingStream(filePath)
    })

    ipcMain.handle("finalize-recording-stream", async (_, filePath: string): Promise<string> => {
        const finalized = await finalizeRecordingStream(filePath)
        // Run ffmpeg post-process to fix metadata / faststart
        const fixed = await fixMp4Metadata(finalized)
        return fixed
    })

    ipcMain.handle("delete-partial-recording", async (_, filePath: string): Promise<void> => {
        return await deletePartialRecording(filePath)
    })

    // FFmpeg handlers removed; recording is saved directly as mp4

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        const filePath = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/app.recorder.html`
        mainWindow.loadURL(filePath)
    } else {
        const filePath = `../renderer/${MAIN_WINDOW_VITE_NAME}/app.recorder.html`
        mainWindow.loadFile(path.join(__dirname, filePath))
    }

    mainWindow.webContents.openDevTools({
        mode: "undocked",
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
