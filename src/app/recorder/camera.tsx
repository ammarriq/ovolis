import "@fontsource-variable/noto-sans-lao"
import "~/index.css"

import { useEffect, useRef, useState } from "react"
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
    const containerRef = useRef<HTMLDivElement | null>(null)
    const draggingRef = useRef(false)
    const dragOffsetRef = useRef<{ x: number; y: number } | null>(null)

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

    // Report the actual video element size and border radius to main
    useEffect(() => {
        let ro: ResizeObserver | null = null
        let rafId: number | null = null

        const report = async () => {
            const videoEl = videoRef.current
            if (!videoEl) return

            const rect = videoEl.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            // Radius in CSS px: if circle, half the min dimension; else 24px (1.5rem)
            const radiusPx = isCircle ? Math.min(rect.width, rect.height) / 2 : 24

            try {
                const bounds = await window.electronAPI.getCurrentWindowBounds?.()
                window.electronAPI.updateCameraMetrics?.({
                    x: bounds?.x ?? 0,
                    y: bounds?.y ?? 0,
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    radiusPx: Math.round(radiusPx),
                    dpr,
                    windowWidth: bounds?.width ?? Math.round(window.innerWidth),
                    windowHeight: bounds?.height ?? Math.round(window.innerHeight),
                })
            } catch {
                // ignore
            }
        }

        // Observe element size changes
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

    // Implement native dragging without -webkit-app-region
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const onMouseDown = async (e: MouseEvent) => {
            const target = e.target as HTMLElement | null
            if (target && target.closest('[data-no-drag="true"]')) return

            // Only left button
            if (e.button !== 0) return

            e.preventDefault()
            try {
                const bounds = await window.electronAPI.getCurrentWindowBounds?.()
                if (!bounds) return
                // Use mouse screen position from the event to minimize IPC
                const offsetX = e.screenX - bounds.x
                const offsetY = e.screenY - bounds.y
                dragOffsetRef.current = { x: offsetX, y: offsetY }
                draggingRef.current = true
                const prevUserSelect = document.body.style.userSelect
                const prevCursor = document.body.style.cursor
                document.body.style.userSelect = "none"
                document.body.style.cursor = "grabbing"

                const onMove = (ev: MouseEvent) => {
                    if (!draggingRef.current || !dragOffsetRef.current) return
                    const nx = ev.screenX - dragOffsetRef.current.x
                    const ny = ev.screenY - dragOffsetRef.current.y
                    window.electronAPI.setCurrentWindowPosition?.(nx, ny)
                }
                const onUp = () => {
                    draggingRef.current = false
                    dragOffsetRef.current = null
                    document.body.style.userSelect = prevUserSelect
                    document.body.style.cursor = prevCursor
                    window.removeEventListener("mousemove", onMove)
                    window.removeEventListener("mouseup", onUp)
                }
                window.addEventListener("mousemove", onMove)
                window.addEventListener("mouseup", onUp)
            } catch {
                // ignore
            }
        }

        el.addEventListener("mousedown", onMouseDown)
        return () => {
            el.removeEventListener("mousedown", onMouseDown)
        }
    }, [])

    return (
        <main className="shadow-cursor group relative flex h-screen w-screen flex-col items-center justify-between p-2">
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

            <div
                ref={containerRef}
                className="size-54 overflow-hidden duration-300 ease-in-out will-change-[border-radius]"
                style={{ borderRadius: isCircle ? "50%" : "1.5rem" }}
            >
                <video
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
