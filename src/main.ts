import path from "node:path"
import { app, BrowserWindow, ipcMain, shell } from "electron"
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

// Global window references
let mainWindow: BrowserWindow | null = null
let floatingWindow: BrowserWindow | null = null

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
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

    ipcMain.handle("get-screen-sources", takeScreenshot)
    ipcMain.handle("resize-window", resizeWindow)
    ipcMain.handle("focus-window", focusWindow)

    // Recording window functionality removed - now using floating bar in main window

    // Floating window handlers
    ipcMain.handle("create-floating-window", (_, source) => {
        return createFloatingWindow(source)
    })

    ipcMain.handle("close-floating-window", () => {
        if (floatingWindow) {
            floatingWindow.close()
            floatingWindow = null
        }
    })

    ipcMain.handle("get-floating-window-data", () => {
        // This can be used to get initial data for the floating window
        return { source: null }
    })

    ipcMain.handle("open-folder", async (_, filePath: string) => {
        const folderPath = path.dirname(filePath)
        await shell.openPath(folderPath)
    })

    ipcMain.handle(
        "start-high-res-recording",
        async (_, sourceId: string, sourceName: string) => {
            return await startHighResRecording(sourceId, sourceName)
        }
    )

    ipcMain.handle(
        "save-recording-data",
        async (_, filePath: string, uint8Array: Uint8Array) => {
            const buffer = Buffer.from(uint8Array)
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

const createFloatingWindow = (source: any) => {
    if (floatingWindow) {
        floatingWindow.close()
    }

    floatingWindow = new BrowserWindow({
        width: 400,
        height: 80,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    // Remove menu bar
    floatingWindow.setMenuBarVisibility(false)

    // Load the floating window HTML
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        floatingWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/floating-window.html`)
    } else {
        floatingWindow.loadFile(path.join(__dirname, "../floating-window.html"))
    }

    // Send source data to floating window when ready
    floatingWindow.webContents.once('did-finish-load', () => {
        floatingWindow?.webContents.executeJavaScript(`
            window.dispatchEvent(new CustomEvent('source-selected', { 
                detail: { source: ${JSON.stringify(source)} } 
            }))
        `)
    })

    floatingWindow.on('closed', () => {
        floatingWindow = null
    })

    return floatingWindow
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
