import { BrowserWindow, desktopCapturer } from "electron"

import { tryCatch } from "~/utils/try-catch"

export async function takeScreenshot() {
    const { data, error } = await tryCatch(async () => {
        const sources = await desktopCapturer.getSources({
            types: ["window", "screen"],
            thumbnailSize: { width: 600, height: 600 },
            fetchWindowIcons: true,
        })

        // Collect all current app window titles to exclude our own UI (main, record bar, camera, devtools)
        const appWindowTitles = new Set(
            BrowserWindow.getAllWindows()
                .map((w) => (w.getTitle() || "").toLowerCase())
                .filter((t) => t.length > 0),
        )

        // Heuristics to exclude OS notifications and flyouts commonly surfaced as windows
        const blockedNameSubstrings = [
            "notification",
            "toast",
            "flyout",
            "tooltip",
            "tool tip",
            "widgets",
            "widget",
            "xaml",
            "shell experience",
            "experience host",
            "input experience",
            "program manager", // desktop surface appears as a window on Windows
            "snipping tool",
            // DevTools/Inspector windows (Chrome/Edge/Electron)
            "devtools",
            "developer tools",
            "inspect",
        ]

        const isScreen = (id: string) => id.toLowerCase().startsWith("screen:")
        const isWindow = (id: string) => id.toLowerCase().startsWith("window:")

        const filtered = sources
            .filter((src) => !src.thumbnail.isEmpty())
            .filter((src) => {
                const name = (src.name || "").toLowerCase()

                // Always keep full screens
                if (isScreen(src.id)) return true

                // Exclude our own app windows by title
                if (appWindowTitles.has(name)) return false

                // Exclude common OS notification/flyout windows
                if (blockedNameSubstrings.some((k) => name.includes(k))) return false

                // Heuristic: many transient overlays/notifications do not have app icons
                if (isWindow(src.id) && !src.appIcon) return false

                return true
            })

        return filtered.map((source) => ({
            id: source.id,
            name: source.name,
            thumbnail: source.thumbnail.toDataURL(),
            displayId: source.display_id,
            appIcon: source.appIcon ? source.appIcon.toDataURL() : null,
        }))
    })

    if (error) {
        console.error("Error getting screen sources:", error)
        throw error
    }

    return data
}
