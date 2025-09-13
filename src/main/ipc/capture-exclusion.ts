import { app, BrowserWindow } from "electron"

let exclusionActive = false

function applyToAllWindows(enabled: boolean) {
    for (const win of BrowserWindow.getAllWindows()) {
        try {
            if (!win.isDestroyed()) {
                win.setContentProtection(enabled)
            }
        } catch {}
    }
}

export function setAppWindowsExcludedFromCapture(enabled: boolean) {
    exclusionActive = !!enabled
    applyToAllWindows(exclusionActive)
}

export function initCaptureExclusionListener() {
    app.on("browser-window-created", (_event, win) => {
        if (exclusionActive) {
            try {
                win.setContentProtection(true)
            } catch {}
        }
    })
}

