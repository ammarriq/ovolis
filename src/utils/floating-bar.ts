import type { ScreenSource } from "~/types/screen-sources"

import { BrowserWindow } from "electron"

import path from "path"

export function createFloatingBar(
    _: Electron.IpcMainInvokeEvent,
    source: ScreenSource
) {
    const floatingWindow = new BrowserWindow({
        width: 400,
        height: 80,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        movable: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    floatingWindow.setMenuBarVisibility(false)

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        const filePath = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/app.floating-bar.html`
        floatingWindow.loadURL(filePath)
    } else {
        const filePath = `../renderer/${MAIN_WINDOW_VITE_NAME}/app.floating-bar.html`
        floatingWindow.loadFile(path.join(__dirname, filePath))
    }

    // Send source data to floating window when ready
    floatingWindow.webContents.once("did-finish-load", () => {
        floatingWindow?.webContents.executeJavaScript(`
            window.dispatchEvent(new CustomEvent('source-selected', { 
                detail: { source: ${JSON.stringify({ ...source })} } 
            }))
        `)
    })

    return floatingWindow
}
