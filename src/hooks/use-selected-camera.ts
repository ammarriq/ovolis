import { useEffect, useState } from "react"

function useSelectedCamera() {
    const [cameraId, setCameraId] = useState<string | null>(null)

    useEffect(() => {
        const handleCameraSelected = (event: CustomEvent<{ cameraId: string }>) => {
            setCameraId(event.detail.cameraId)
        }

        window.addEventListener("camera-selected", handleCameraSelected)

        return () => {
            window.removeEventListener("camera-selected", handleCameraSelected)
        }
    }, [])

    return cameraId
}

export default useSelectedCamera
