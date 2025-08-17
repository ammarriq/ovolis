import { desktopCapturer } from "electron"

export async function takeScreenshot() {
    try {
        const sources = await desktopCapturer.getSources({
            types: ["window", "screen"],
            thumbnailSize: { width: 800, height: 800 },
            fetchWindowIcons: true,
        })

        return sources.map((source) => ({
            id: source.id,
            name: source.name,
            thumbnail: source.thumbnail.toDataURL(),
            displayId: source.display_id,
            appIcon: source.appIcon ? source.appIcon.toDataURL() : null,
        }))
    } catch (error) {
        console.error("Error getting screen sources:", error)
        throw error
    }
}
