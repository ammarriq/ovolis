import type { RecordConfig } from "~/types/record-config"

import { BrowserWindow, ipcMain, screen } from "electron"

import path from "path"

function createRecordBar(config: RecordConfig): BrowserWindow {
    // Desired window size
    const windowWidth = 223
    const windowHeight = 64

    // Calculate bottom-center position on the primary display's work area
    const { workArea } = screen.getPrimaryDisplay()
    const margin = 12 // small offset from the very bottom
    const x = Math.round(workArea.x + (workArea.width - windowWidth) / 2)
    const y = Math.round(workArea.y + workArea.height - windowHeight - margin)

    const recordBarWindow = new BrowserWindow({
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

    recordBarWindow.setMenuBarVisibility(false)

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        const filePath = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/app.record-bar.html`
        recordBarWindow.loadURL(filePath)
    } else {
        const filePath = `../renderer/${MAIN_WINDOW_VITE_NAME}/app.record-bar.html`
        recordBarWindow.loadFile(path.join(__dirname, filePath))
    }

    // Send source data to floating window when ready
    recordBarWindow.webContents.once("did-finish-load", () => {
        // Safer than executeJavaScript: use IPC to notify renderer
        if (!recordBarWindow.isDestroyed()) {
            recordBarWindow.webContents.send("record-bar:config-selected", { ...config })
        }
        // Show after the content is ready to avoid white flash on spawn
        if (!recordBarWindow.isDestroyed()) {
            recordBarWindow.show()
        }
    })

    return recordBarWindow
}

let recordBarWindow: BrowserWindow | null = null

export function registerRecordBarIpc() {
    ipcMain.handle("create-record-bar", async (event, config: RecordConfig) => {
        if (recordBarWindow) recordBarWindow.close()

        recordBarWindow = createRecordBar(config)
        recordBarWindow.on("closed", () => {
            recordBarWindow = null
        })

        // Close the window that initiated recording (usually the main/recorder window)
        const caller = BrowserWindow.fromWebContents(event.sender)
        if (caller && !caller.isDestroyed()) caller.close()

        return { success: true }
    })

    ipcMain.handle("close-record-bar", () => {
        if (recordBarWindow) {
            recordBarWindow.close()
            recordBarWindow = null
        }
    })
}
