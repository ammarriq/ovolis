import { app } from "electron"

import { spawn } from "child_process"
import * as path from "path"

// Load the native addon
let nativeAddon: {
    resizeWindow: (
        appName: string,
        width: number,
        height: number
    ) => Promise<string>
}
try {
    // Try to load the compiled native addon
    // In Electron, __dirname might be different, so we need to use app.getAppPath()
    const appPath = app.getAppPath()
    const addonPath = path.join(
        appPath,
        "src/native/build/Release/window_resizer.node"
    )
    console.log("Attempting to load native addon from:", addonPath)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeAddon = require(addonPath)
    console.log("Native addon loaded successfully")
} catch (error) {
    console.warn(
        "Native addon not available, falling back to PowerShell method:",
        error
    )
    nativeAddon = null
}

/**
 * Fallback method using PowerShell for window resizing
 * @param appName - Application name/window title
 * @param width - Target width
 * @param height - Target height
 * @returns Promise resolving to operation result message
 */
async function fallbackPowerShellResize(
    appName: string,
    width: number,
    height: number
): Promise<string> {
    return new Promise((resolve) => {
        const script = `
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                public class Win32 {
                    [DllImport("user32.dll")]
                    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
                    [DllImport("user32.dll")]
                    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
                    [DllImport("user32.dll")]
                    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
                    [StructLayout(LayoutKind.Sequential)]
                    public struct RECT { public int Left, Top, Right, Bottom; }
                }
"@
            $hwnd = [Win32]::FindWindow($null, "${appName}")
            if ($hwnd -eq [IntPtr]::Zero) {
                Write-Output "❌ Window '${appName}' not found."
                exit 1
            }
            $rect = New-Object Win32+RECT
            [Win32]::GetWindowRect($hwnd, [ref]$rect)
            $success = [Win32]::SetWindowPos($hwnd, [IntPtr]::Zero, $rect.Left, $rect.Top, ${width}, ${height}, 0x0054)
            if ($success) {
                Write-Output "✅ Successfully resized '${appName}' to ${width}x${height} pixels using PowerShell fallback."
            } else {
                Write-Output "❌ Failed to resize '${appName}'."
            }
        `

        const powershell = spawn("powershell.exe", ["-Command", script], {
            stdio: ["pipe", "pipe", "pipe"],
        })

        let output = ""
        let errorOutput = ""

        powershell.stdout.on("data", (data) => {
            output += data.toString()
        })

        powershell.stderr.on("data", (data) => {
            errorOutput += data.toString()
        })

        powershell.on("close", (code) => {
            if (code === 0 && output.trim()) {
                resolve(output.trim())
            } else {
                resolve(
                    `❌ PowerShell fallback failed: ${errorOutput || "Unknown error"}`
                )
            }
        })

        powershell.on("error", (error) => {
            resolve(`❌ PowerShell execution error: ${error.message}`)
        })
    })
}

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

    try {
        // Try native addon first
        if (nativeAddon && nativeAddon.resizeWindow) {
            const result = nativeAddon.resizeWindow(appName, width, height)
            return result
        }

        // Fallback to PowerShell method
        console.log("Using PowerShell fallback for window resizing")
        return await fallbackPowerShellResize(appName, width, height)
    } catch (error) {
        console.error("Window resize error:", error)
        // Final fallback to PowerShell
        return await fallbackPowerShellResize(appName, width, height)
    }
}
