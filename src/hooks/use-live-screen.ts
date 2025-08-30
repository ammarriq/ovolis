import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useRef } from "react"

interface Props {
    selectedScreen: ScreenSource | null
}

interface ChromeDesktopVideoConstraints extends MediaTrackConstraints {
    mandatory?: {
        chromeMediaSource?: "desktop" | "screen" | "window"
        chromeMediaSourceId?: string
    }
}

function useLiveScreen({ selectedScreen }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (!selectedScreen) return

        let stopped = false
        let localStream: MediaStream | null = null
        const videoEl = videoRef.current

        const startPreview = async () => {
            try {
                const constraints: MediaStreamConstraints = {
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: "desktop",
                            chromeMediaSourceId: selectedScreen.id,
                        },
                    } as ChromeDesktopVideoConstraints,
                }

                const stream = await navigator.mediaDevices.getUserMedia(constraints)

                if (stopped) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }

                localStream = stream
                if (videoEl) {
                    videoEl.srcObject = stream
                    try {
                        await videoEl.play()
                    } catch {
                        /* ignore */
                    }
                }
            } catch (err) {
                console.error("Failed to start live preview:", err)
            }
        }

        startPreview()

        return () => {
            stopped = true
            if (videoEl) {
                try {
                    videoEl.pause()
                } catch {}

                videoEl.srcObject = null
            }
            if (localStream) {
                localStream.getTracks().forEach((t) => t.stop())
            }
        }
    }, [selectedScreen])

    return { videoRef }
}

export default useLiveScreen
