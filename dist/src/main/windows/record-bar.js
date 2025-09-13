import { BrowserWindow, ipcMain } from "electron";
import { createRecordBar } from "~/utils/record-bar";
let recordBarWindow = null;
export function registerRecordBarIpc() {
    ipcMain.handle("create-record-bar", async (event, config) => {
        if (recordBarWindow)
            recordBarWindow.close();
        recordBarWindow = createRecordBar(config);
        recordBarWindow.on("closed", () => {
            recordBarWindow = null;
        });
        // Close the window that initiated recording (usually the main/recorder window)
        const caller = BrowserWindow.fromWebContents(event.sender);
        if (caller && !caller.isDestroyed())
            caller.close();
        return { success: true };
    });
    ipcMain.handle("close-record-bar", () => {
        if (recordBarWindow) {
            recordBarWindow.close();
            recordBarWindow = null;
        }
    });
}
//# sourceMappingURL=record-bar.js.map