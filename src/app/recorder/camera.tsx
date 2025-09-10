import "@fontsource-variable/noto-sans-lao"
import "~/index.css"

import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "react-aria-components"

import useLiveVideo from "~/hooks/use-live-video"
import useSelectedCamera from "~/hooks/use-selected-camera"
import useWindowDrag from "~/hooks/use-window-drag"
import { CircleIcon } from "~/icons/circle"
import { CloseIcon } from "~/icons/close"
import { SquareIcon } from "~/icons/square"
import { tryCatchSync } from "~/utils/try-catch"

function Camera() {
    const [isCircle, setIsCircle] = useState(false)

    const cameraId = useSelectedCamera()
    const { containerRef } = useWindowDrag()
    const { videoRef } = useLiveVideo({
        cameraId,
    })

    // Report the actual video element size and border radius to main
    useEffect(() => {
        let ro: ResizeObserver | null = null
        let rafId: number | null = null

        const report = async () => {
            const videoEl = videoRef.current
            if (!videoEl) return

            const rect = videoEl.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            // Read the effective border radius in pixels from computed styles
            // This ensures record-bar.tsx matches the exact rounding (including rem/%).
            let radiusPx = 0
            
            try {
                const cs = window.getComputedStyle(videoEl)
                // Use top-left radius as the canonical value; for circles it equals half size.
                const rStr = cs.borderTopLeftRadius || "0px"
                const parsed = parseFloat(rStr)
                if (!Number.isNaN(parsed)) {
                    radiusPx = parsed
                } else {
                    radiusPx = isCircle ? Math.min(rect.width, rect.height) / 2 : 24
                }
            } catch {
                radiusPx = isCircle ? Math.min(rect.width, rect.height) / 2 : 24
            }

            tryCatchSync(
                window.electronAPI.updateCameraMetrics({
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    radiusPx: Math.round(radiusPx),
                    dpr,
                }),
            )
        }

        // Observe element size/border-radius changes
        if (videoRef.current) {
            ro = new ResizeObserver(() => {
                if (rafId) cancelAnimationFrame(rafId)
                rafId = requestAnimationFrame(report)
            })
            ro.observe(videoRef.current)
        }

        // Also report on mount and when radius state changes
        report()

        const onResize = () => {
            if (rafId) cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(report)
        }
        window.addEventListener("resize", onResize)

        return () => {
            if (ro) ro.disconnect()
            if (rafId) cancelAnimationFrame(rafId)
            window.removeEventListener("resize", onResize)
        }
    }, [isCircle, videoRef])

    return (
        <main
            className="shadow-cursor group relative flex size-54 h-screen w-screen flex-col items-center justify-between overflow-hidden duration-300 ease-in-out will-change-[border-radius]"
            style={{ borderRadius: isCircle ? "50%" : "2rem" }}
            ref={containerRef}
        >
            <div
                className="shadow-cursor fixed bottom-4 left-1/2 z-50 hidden max-w-max -translate-x-1/2 items-center gap-1 rounded-md bg-white p-1 group-hover:flex"
                data-no-drag="true"
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

            <video
                ref={videoRef}
                className="size-full [border-radius:inherit] bg-black object-cover"
                autoPlay
                muted
                playsInline
            />
        </main>
    )
}

const root = createRoot(document.body)
root.render(<Camera />)
