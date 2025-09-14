import { useEffect, useState } from "react"

function useSaveLocation() {
    const [saveLocation, setSaveLocation] = useState("")

    // Load any existing save location for current session
    useEffect(() => {
        if (window.electronAPI?.getSaveLocation) {
            window.electronAPI.getSaveLocation().then((dir) => {
                if (dir) setSaveLocation(dir)
            })
        }
    }, [])

    return { saveLocation, setSaveLocation }
}

export default useSaveLocation
