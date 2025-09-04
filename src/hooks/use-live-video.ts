import { useEffect, useMemo, useRef } from "react"

type Props = {
    screenId?: string | null
    cameraId?: string | null
}

interface ChromeDesktopVideoConstraints extends MediaTrackConstraints {
    mandatory?: {
        chromeMediaSource?: "desktop" | "screen" | "window"
        chromeMediaSourceId?: string
    }
}

function useLiveVideo({ screenId, cameraId }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)

    const constraints = useMemo(() => {
        if (!cameraId && !screenId) return

        if (screenId) {
            return {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: screenId,
                    },
                } as ChromeDesktopVideoConstraints,
            }
        }

        return {
            audio: false,
            video: { deviceId: { exact: cameraId } },
        }
    }, [cameraId, screenId])

    useEffect(() => {
        if (!constraints) return

        let stopped = false
        let localStream: MediaStream | null = null
        const videoEl = videoRef.current

        const startPreview = async () => {
            try {
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
    }, [constraints])

    return { videoRef }
}

export default useLiveVideo
