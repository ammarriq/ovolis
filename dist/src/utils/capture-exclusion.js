import { app, BrowserWindow } from "electron";
let exclusionActive = false;
function applyToAllWindows(enabled) {
    for (const win of BrowserWindow.getAllWindows()) {
        try {
            if (!win.isDestroyed()) {
                win.setContentProtection(enabled);
            }
        }
        catch { }
    }
}
export function setAppWindowsExcludedFromCapture(enabled) {
    exclusionActive = !!enabled;
    applyToAllWindows(exclusionActive);
}
export function initCaptureExclusionListener() {
    app.on("browser-window-created", (_event, win) => {
        if (exclusionActive) {
            try {
                win.setContentProtection(true);
            }
            catch { }
        }
    });
}
//# sourceMappingURL=capture-exclusion.js.map