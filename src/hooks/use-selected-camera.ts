import { useEffect, useState } from "react"

function useSelectedCamera() {
    const [cameraId, setCameraId] = useState<string | null>(null)

    useEffect(() => {
        const handleCameraSelected = (event: CustomEvent<{ cameraId: string }>) => {
            setCameraId(event.detail.cameraId)
        }

        // @ts-expect-error - camera-selected is not available in typescript
        window.addEventListener("camera-selected", handleCameraSelected)

        return () => {
            // @ts-expect-error - camera-selected is not available in typescript
            window.removeEventListener("camera-selected", handleCameraSelected)
        }
    }, [])

    return cameraId
}

export default useSelectedCamera
