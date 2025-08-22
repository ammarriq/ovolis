import type { ScreenSource } from "./types/screen-sources.js"

import path from "node:path"
import { app, BrowserWindow, ipcMain, shell } from "electron"
import started from "electron-squirrel-startup"

import { createFloatingBar } from "./utils/floating-bar.js"
import { saveRecording, startRecording } from "./utils/start-recording.js"
import {
    closeRecordingStream,
    finalizeRecordingStream,
    openRecordingStream,
    writeRecordingChunk,
    deletePartialRecording,
} from "./utils/recording-stream.js"
import { fixMp4Metadata } from "./utils/ffmpeg-post.js"
import { takeScreenshot } from "./utils/take-screenshots.js"
import { focusWindow, resizeWindow } from "./utils/window-manager.js"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit()
}

// Global window references
let mainWindow: BrowserWindow | null = null
let floatingWindow: BrowserWindow | null = null

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: "hidden",
        maximizable: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    mainWindow.setMenuBarVisibility(false)

    // window actions
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
    ipcMain.handle(
        "start-recording",
        (_, source: Pick<ScreenSource, "id" | "name">) => {
            return startRecording(source.id, source.name)
        }
    )

    ipcMain.handle(
        "save-recording",
        async (_, filePath: string, uint8Array: Uint8Array) => {
            const buffer = Buffer.from(uint8Array)
            return await saveRecording(filePath, buffer)
        }
    )

    // Streaming save APIs
    ipcMain.handle(
        "open-recording-stream",
        async (_, filePath: string): Promise<string> => {
            return await openRecordingStream(filePath)
        }
    )

    ipcMain.handle(
        "write-recording-chunk",
        async (_, filePath: string, uint8Array: Uint8Array): Promise<void> => {
            const buffer = Buffer.from(uint8Array)
            return await writeRecordingChunk(filePath, buffer)
        }
    )

    ipcMain.handle(
        "close-recording-stream",
        async (_, filePath: string): Promise<void> => {
            return await closeRecordingStream(filePath)
        }
    )

    ipcMain.handle(
        "finalize-recording-stream",
        async (_, filePath: string): Promise<string> => {
            const finalized = await finalizeRecordingStream(filePath)
            // Run ffmpeg post-process to fix metadata / faststart
            const fixed = await fixMp4Metadata(finalized)
            return fixed
        }
    )

    ipcMain.handle(
        "delete-partial-recording",
        async (_, filePath: string): Promise<void> => {
            return await deletePartialRecording(filePath)
        }
    )

    // FFmpeg handlers removed; recording is saved directly as mp4

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        const filePath = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/app.recorder.html`
        mainWindow.loadURL(filePath)
    } else {
        const filePath = `../renderer/${MAIN_WINDOW_VITE_NAME}/app.recorder.html`
        mainWindow.loadFile(path.join(__dirname, filePath))
    }

    mainWindow.webContents.openDevTools()
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
