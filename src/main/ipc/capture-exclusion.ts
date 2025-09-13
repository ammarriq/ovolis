import { app, BrowserWindow } from "electron"

let exclusionActive = false

function applyToAllWindows(enabled: boolean) {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.setContentProtection(enabled)
        }
    }
}

export function setAppWindowsExcludedFromCapture(enabled: boolean) {
    exclusionActive = !!enabled
    applyToAllWindows(exclusionActive)
}

export function initCaptureExclusionListener() {
    app.on("browser-window-created", (_event, win) => {
        if (exclusionActive) {
            win.setContentProtection(true)
        }
    })
}
