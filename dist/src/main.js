import { app, BrowserWindow } from "electron";
import started from "electron-squirrel-startup";
import { registerGlobalIpc } from "~/main/ipc/global";
import { registerRecordingIpc } from "~/main/ipc/recording";
import { registerCameraIpc } from "~/main/windows/camera";
import { createRecorderWindow, registerRecorderWindowIpc } from "~/main/windows/recorder";
import { registerRecordBarIpc } from "~/main/windows/record-bar";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}
function bootstrapIpc() {
    registerGlobalIpc();
    registerRecorderWindowIpc();
    registerCameraIpc();
    registerRecordBarIpc();
    registerRecordingIpc();
}
// Ready: register IPCs and spawn the recorder window
app.on("ready", () => {
    bootstrapIpc();
    createRecorderWindow();
});
// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
app.on("activate", () => {
    // Re-create a window in the app when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createRecorderWindow();
    }
});
//# sourceMappingURL=main.js.map