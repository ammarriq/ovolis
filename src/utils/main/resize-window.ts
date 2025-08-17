import { exec } from "child_process"

export async function resizeWindow(
    _event: Electron.IpcMainInvokeEvent,
    options: { appName: string; width: number; height: number }
) {
    const { appName, width, height } = options

    // Simple PowerShell approach for Windows
    const command = `
    $proc = Get-Process | Where-Object {$_.MainWindowTitle -like "*${appName}*"} | Select-Object -First 1
    if ($proc) {
      Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class Win32 {
          [DllImport("user32.dll")]
          public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
      }
"@
      [Win32]::SetWindowPos($proc.MainWindowHandle, 0, -1, -1, ${width}, ${height}, 0x0001)
    }
  `

    return new Promise((resolve, reject) => {
        exec(`powershell -Command "${command}"`, (error) => {
            if (error) reject(error.message)
            else resolve("Window resized successfully")
        })
    })
}
