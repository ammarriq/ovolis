import "@fontsource-variable/noto-sans-lao"
import "~/index.css"

import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "react-aria-components"

import useDevices from "~/hooks/use-devices"
import useLiveVideo from "~/hooks/use-live-video"
import { CircleIcon } from "~/icons/circle"
import { CloseIcon } from "~/icons/close"
import { SquareIcon } from "~/icons/square"

function Camera() {
    const [cameraId, setCameraId] = useState<string | null>(null)
    const [isCircle, setIsCircle] = useState(false)

    const { cameras } = useDevices()
    const { videoRef } = useLiveVideo({
        cameraId: cameraId ?? cameras[0]?.deviceId ?? null,
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
        <main className="shadow-cursor relative flex h-screen w-screen flex-col items-center justify-between p-2">
            <div
                className="shadow-cursor flex max-w-max items-center gap-1 rounded-md bg-white p-1"
                style={{ WebkitAppRegion: "no-drag" }}
            >
                <Button
                    className="rounded-md p-1 hover:bg-[#F3F4F6]"
                    onPress={() => setIsCircle(false)}
                >
                    <SquareIcon className="size-4.5" />
                </Button>

                <Button
                    className="rounded-md p-1 hover:bg-[#F3F4F6]"
                    onPress={() => setIsCircle(true)}
                >
                    <CircleIcon className="size-4.5" />
                </Button>

                <Button
                    className="rounded-md p-1 hover:bg-[#F3F4F6]"
                    onPress={() => window.electronAPI.closeCamera()}
                >
                    <CloseIcon strokeWidth={2} className="size-4.5" />
                </Button>
            </div>

            <div
                className="size-50 overflow-hidden duration-300 ease-in-out will-change-[border-radius]"
                style={{ borderRadius: isCircle ? "50%" : "1.5rem" }}
            >
                <video
                    style={{ WebkitAppRegion: "drag" }}
                    ref={videoRef}
                    className="size-full [border-radius:inherit] bg-black object-cover"
                    autoPlay
                    muted
                    playsInline
                />
            </div>
        </main>
    )
}

const root = createRoot(document.body)
root.render(<Camera />)
