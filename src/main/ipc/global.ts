import { BrowserWindow, dialog, ipcMain, screen, shell } from "electron"

import path from "path"

import {
    initCaptureExclusionListener,
    setAppWindowsExcludedFromCapture,
} from "~/main/ipc/capture-exclusion"
import { takeScreenshot } from "~/main/ipc/take-screenshots"
import { getSaveDirectory, setSaveDirectory } from "~/main/recording/save-location"
import { getSetting, setSetting, loadSettings } from "~/main/settings/app-settings"
import { focusWindow, resizeWindow } from "~/main/window-manager"

/**
 * Register IPC handlers that are not tied to a specific window.
 */
export function registerGlobalIpc() {
    // Cursor/window helpers for native dragging without app-region
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

    // Window manager actions (native addon)
    ipcMain.handle("get-screen-sources", takeScreenshot)
    ipcMain.handle("resize-window", resizeWindow)
    ipcMain.handle("focus-window", focusWindow)

    // Display metrics
    ipcMain.handle("get-display-metrics", (_evt, displayId?: string) => {
        const displays = screen.getAllDisplays()
        const display =
            displays.find((d) => d.id.toString() === displayId) ?? screen.getPrimaryDisplay()
        const { width, height } = display.workAreaSize
        return { width, height, displayId: display.id.toString() }
    })

    // File system convenience
    ipcMain.handle("open-folder", async (_evt, filePath: string) => {
        const folderPath = path.dirname(filePath)
        await shell.openPath(folderPath)
    })

    // Choose and store a custom recordings directory
    ipcMain.handle("choose-save-location", async (evt) => {
        const win = BrowserWindow.fromWebContents(evt.sender)
        if (!win) return null

        const result = await dialog.showOpenDialog(win, {
            properties: ["openDirectory", "createDirectory"],
        })
        if (!result.canceled && result.filePaths.length > 0) {
            const dir = result.filePaths[0]
            setSaveDirectory(dir)
            return dir
        }
        return null
    })

    ipcMain.handle("get-save-location", async () => {
        return getSaveDirectory()
    })

    // App settings persistence
    ipcMain.handle("get-app-setting", async (_, key: string) => {
        return await getSetting(key as any)
    })

    ipcMain.handle("set-app-setting", async (_, key: string, value: any) => {
        await setSetting(key as any, value)
    })

    ipcMain.handle("load-app-settings", async () => {
        return await loadSettings()
    })

    // Toggle excluding our app windows from being recorded (OS-level content protection)
    ipcMain.handle("set-exclude-app-windows-from-capture", (_evt, enabled: boolean) => {
        setAppWindowsExcludedFromCapture(!!enabled)
    })

    // Ensure any windows created while exclusion is active inherit protection
    initCaptureExclusionListener()
}
