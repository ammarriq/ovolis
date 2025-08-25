import type { ScreenSource } from "./types/screen-sources"

import { app, BrowserWindow, ipcMain, shell } from "electron"
import started from "electron-squirrel-startup"

import path from "path"

import { fixMp4Metadata } from "./utils/ffmpeg-post"
import { createFloatingBar } from "./utils/floating-bar"
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

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 306,
        height: 99,
        minWidth: 306,
        minHeight: 99,
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

    mainWindow.setMenuBarVisibility(false)

    // window actions
    ipcMain.handle("set-window-size", (_, width: number, height: number) => {
        if (mainWindow) mainWindow.setSize(width, height)
    })

    ipcMain.handle("set-default-size", () => {
        console.log("Setting default size")
        if (mainWindow) mainWindow.setSize(306, 99)
    })

    ipcMain.handle("window-close", () => {
        if (mainWindow) mainWindow.close()
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

    // floating bar actions
    ipcMain.handle("create-floating-bar", async (_, source: ScreenSource) => {
        if (floatingWindow) floatingWindow.close()

        floatingWindow = createFloatingBar(_, source)
        floatingWindow.on("closed", () => {
            floatingWindow = null
        })

        if (mainWindow) mainWindow.close()

        return { success: true }
    })

    ipcMain.handle("close-floating-bar", () => {
        if (floatingWindow) {
            floatingWindow.close()
            floatingWindow = null
        }
    })

    ipcMain.handle("open-folder", async (_, filePath: string) => {
        const folderPath = path.dirname(filePath)
        await shell.openPath(folderPath)
    })

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
