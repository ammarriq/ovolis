import path from "node:path"
import { app, BrowserWindow, ipcMain } from "electron"
import started from "electron-squirrel-startup"

import {
    saveRecordingData,
    startHighResRecording,
} from "./utils/main/start-recording.js"
import { takeScreenshot } from "./utils/main/take-screenshots"
import { focusWindow, resizeWindow } from "./utils/main/window-manager.js"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit()
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: "hidden", // Hide title bar
        maximizable: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    // Remove menu bar
    mainWindow.setMenuBarVisibility(false)

    // Handle window controls
    ipcMain.handle("window-close", () => {
        mainWindow.close()
    })

    ipcMain.handle("window-minimize", () => {
        mainWindow.minimize()
    })

    ipcMain.handle("window-maximize", () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize()
        else mainWindow.maximize()
    })

    ipcMain.handle("get-screen-sources", takeScreenshot)
    ipcMain.handle("resize-window", resizeWindow)
    ipcMain.handle("focus-window", focusWindow)

    ipcMain.handle(
        "start-high-res-recording",
        async (_, sourceId: string, sourceName: string) => {
            return await startHighResRecording(sourceId, sourceName)
        }
    )
    ipcMain.handle(
        "save-recording-data",
        async (_, filePath: string, buffer: Buffer) => {
            return await saveRecordingData(filePath, buffer)
        }
    )

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    } else {
        const filePath = `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
        mainWindow.loadFile(path.join(__dirname, filePath))
    }

    // Open the DevTools.
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
