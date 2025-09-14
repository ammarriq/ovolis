import { useEffect, useState } from "react"

function useSaveLocation() {
    const [saveLocation, setSaveLocation] = useState("")

    const getDirName = (p: string) => {
        if (!p) return ""
        const norm = p.replace(/\\/g, "/")
        const parts = norm.split("/")
        return parts[parts.length - 1] || p
    }

    // Load any existing save location for current session
    useEffect(() => {
        if (window.electronAPI?.getSaveLocation) {
            window.electronAPI.getSaveLocation().then((dir) => {
                if (dir) setSaveLocation(dir)
            })
        }
    }, [])

    return { saveLocation, setSaveLocation, dirName: getDirName(saveLocation) }
}

export default useSaveLocation
