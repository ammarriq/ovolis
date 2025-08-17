import { desktopCapturer } from "electron"

export async function takeScreenshot() {
    try {
        const sources = await desktopCapturer.getSources({
            types: ["window", "screen"],
            thumbnailSize: { width: 320, height: 320 },
            fetchWindowIcons: true,
        })

        return sources
            .filter((o) => !o.name.includes("Recrod"))
            .filter((o) => !o.thumbnail.isEmpty())
            .map((source) => ({
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
