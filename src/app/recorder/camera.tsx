import "@fontsource-variable/noto-sans-lao"
import "~/index.css"

import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import useDevices from "~/hooks/use-devices"
import useLiveVideo from "~/hooks/use-live-video"

function Camera() {
    const [_cameraId, setCameraId] = useState<string | null>(null)

    const { cameras } = useDevices()
    const { videoRef } = useLiveVideo({
        cameraId: cameras[0]?.deviceId,
    })

    useEffect(() => {
        const handleCameraSelected = (event: CustomEvent<{ cameraId: string }>) => {
            setCameraId(event.detail.cameraId)
        }

        window.addEventListener("camera-selected", handleCameraSelected)

        return () => {
            window.removeEventListener("camera-selected", handleCameraSelected)
        }
    }, [])

    return (
        <main className="h-screen w-screen" style={{ WebkitAppRegion: "drag" }}>
            <div className="size-full overflow-hidden rounded-full bg-black">
                <video
                    ref={videoRef}
                    className="size-full object-cover"
                    autoPlay
                    muted
                    playsInline
                />
            </div>
            <div className="fixed bottom-0 left-1/2 w-40 -translate-x-1/2 rounded-sm bg-white p-1"></div>
        </main>
    )
}

const root = createRoot(document.body)
root.render(<Camera />)
