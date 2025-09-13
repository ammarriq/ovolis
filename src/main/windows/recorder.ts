import { app, BrowserWindow, ipcMain } from "electron"

import path from "path"

const DEFAULT_WIDTH = 280
const DEFAULT_HEIGHT = 354

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

export function registerRecorderWindowIpc() {
    // Window size controls for the sender window (recorder UI)
    ipcMain.handle("set-window-size", (event, width?: number, height?: number) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || win.isDestroyed()) return

        const newWidth = width ?? DEFAULT_WIDTH
        const newHeight = height ?? DEFAULT_HEIGHT

        win.setMinimumSize(newWidth, newHeight)
        win.setSize(newWidth, newHeight)
    })

    ipcMain.handle("window-close", (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win && !win.isDestroyed()) {
            // Close all windows to mimic previous behavior
            for (const w of BrowserWindow.getAllWindows()) w.close()
        }
    })

    ipcMain.handle("window-minimize", (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win && !win.isDestroyed()) win.minimize()
    })

    ipcMain.handle("window-maximize", (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (!win || win.isDestroyed()) return
        if (win.isMaximized()) win.unmaximize()
        else win.maximize()
    })
}

export function createRecorderWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
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

    mainWindow.setMenuBarVisibility(false)

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        const filePath = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/app.recorder.html`
        mainWindow.loadURL(filePath)
    } else {
        const filePath = `../renderer/${MAIN_WINDOW_VITE_NAME}/app.recorder.html`
        mainWindow.loadFile(path.join(__dirname, filePath))
    }

    mainWindow.webContents.openDevTools({ mode: "undocked" })
    return mainWindow
}

export const RecorderWindowDefaults = { DEFAULT_WIDTH, DEFAULT_HEIGHT }
