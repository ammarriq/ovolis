export type OverlayDrawFn = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
) => void

function useVideoCompositor() {
    const createVideoCompositor = async (opts: {
        screenStream: MediaStream
        compFps: number
        overlayDraw?: OverlayDrawFn
    }) => {
        const { screenStream, compFps, overlayDraw } = opts

        const canvas = document.createElement("canvas")
        canvas.width = 2
        canvas.height = 2

        const ctx = canvas.getContext("2d")

        const screenVideoEl = document.createElement("video")
        screenVideoEl.muted = true
        screenVideoEl.playsInline = true
        screenVideoEl.autoplay = true
        screenVideoEl.srcObject = screenStream

        await screenVideoEl.play()

        let canvasWidth = 0
        let canvasHeight = 0

        const applyNativeCanvasSize = () => {
            const vw = screenVideoEl.videoWidth
            const vh = screenVideoEl.videoHeight
            if (vw !== canvasWidth || vh !== canvasHeight) {
                canvasWidth = vw
                canvasHeight = vh
                canvas.width = canvasWidth
                canvas.height = canvasHeight
            }
        }

        // Ensure the output canvas matches the captured source dimensions
        if (!screenVideoEl.videoWidth || !screenVideoEl.videoHeight) {
            await new Promise<void>((resolve) => {
                const onReady = () => {
                    applyNativeCanvasSize()
                    resolve()
                }

                try {
                    if (screenVideoEl.readyState >= 1) onReady()
                    else screenVideoEl.onloadedmetadata = onReady
                } catch {
                    // Fallback to 1080p if metadata fails
                    canvasWidth = 1920
                    canvasHeight = 1080
                    canvas.width = canvasWidth
                    canvas.height = canvasHeight
                    resolve()
                }
            })
        } else {
            applyNativeCanvasSize()
        }

        screenVideoEl.onresize = applyNativeCanvasSize

        const targetMs = 1000 / Math.min(24, Math.max(1, compFps))
        let lastDraw = 0
        let running = true

        const doDraw = (now: number) => {
            if (!running) return
            if (now - lastDraw < targetMs - 1) return
            lastDraw = now

            // Paint black background to avoid transparency edges
            ctx.save()
            ctx.fillStyle = "#000"
            ctx.fillRect(0, 0, canvasWidth, canvasHeight)
            ctx.restore()
            // Draw the screen at its intrinsic size (no scaling) to avoid any stretching
            ctx.drawImage(screenVideoEl, 0, 0)

            overlayDraw(ctx, canvasWidth, canvasHeight)
        }

        const rvfcVideo = screenVideoEl
        if (typeof rvfcVideo.requestVideoFrameCallback === "function") {
            const onFrame = (now: number) => {
                doDraw(now)
                if (!running) return

                rvfcVideo.requestVideoFrameCallback(onFrame)
            }

            rvfcVideo.requestVideoFrameCallback(onFrame)
        } else {
            const loop = (now: number) => {
                if (!running) return

                doDraw(now)
                requestAnimationFrame(loop)
            }

            requestAnimationFrame(loop)
        }

        const canvasStream = canvas.captureStream(Math.min(30, compFps))

        const dispose = () => {
            running = false
            screenVideoEl.onresize = null
        }

        return { canvas, screenVideoEl, canvasStream, dispose }
    }

    return { createVideoCompositor }
}

export default useVideoCompositor
