import { app } from "electron"

import * as path from "path"

const appPath = app.getAppPath()
const addonPath = app.isPackaged
    ? path.join(process.resourcesPath, "window_resizer.node")
    : path.join(appPath, "native/build/Release/window_resizer.node")

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nativeAddon = require(addonPath)

/**
 * Resize external window using native Windows API calls
 * @param _event - Electron IPC event (unused)
 * @param options - Resize options containing appName, width, and height
 * @returns Promise resolving to operation result message
 */
export async function resizeWindow(
    _event: Electron.IpcMainInvokeEvent,
    options: { appName: string; width: number; height: number }
): Promise<string> {
    const { appName, width, height } = options

    if (nativeAddon && nativeAddon.resizeWindow) {
        const result = nativeAddon.resizeWindow(appName, width, height)
        return result
    }
}
