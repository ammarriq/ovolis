import { tryCatch, tryCatchSync } from "~/utils/try-catch"

function useCameraOverlay() {
    // Compute camera PiP overlay clip-path and draw geometry (cover) for a bottom-right placement
    const computeCameraOverlayGeometry = (args: {
        canvasWidth: number
        canvasHeight: number
        overlayW: number
        overlayH: number
        overlayRadiusPx: number
        padding: number
        camVideoW: number
        camVideoH: number
    }) => {
        const {
            canvasWidth,
            canvasHeight,
            overlayW,
            overlayH,
            overlayRadiusPx,
            padding,
            camVideoW,
            camVideoH,
        } = args

        const x = canvasWidth - overlayW - padding
        const y = canvasHeight - overlayH - padding
        const p = new Path2D()
        const r = Math.min(overlayRadiusPx, overlayW / 2, overlayH / 2)
        p.moveTo(x + r, y)
        p.lineTo(x + overlayW - r, y)
        p.quadraticCurveTo(x + overlayW, y, x + overlayW, y + r)
        p.lineTo(x + overlayW, y + overlayH - r)
        p.quadraticCurveTo(x + overlayW, y + overlayH, x + overlayW - r, y + overlayH)
        p.lineTo(x + r, y + overlayH)
        p.quadraticCurveTo(x, y + overlayH, x, y + overlayH - r)
        p.lineTo(x, y + r)
        p.quadraticCurveTo(x, y, x + r, y)
        p.closePath()

        const vw = camVideoW || overlayW
        const vh = camVideoH || overlayH
        const scale = Math.max(overlayW / vw, overlayH / vh)
        const drawDW = vw * scale
        const drawDH = vh * scale
        const drawDX = x + (overlayW - drawDW) / 2
        const drawDY = y + (overlayH - drawDH) / 2

        return {
            clipPath: p,
            drawDX,
            drawDY,
            drawDW,
            drawDH,
            srcVW: vw,
            srcVH: vh,
        }
    }

    // Helper to setup camera overlay: acquires camera stream, tracks overlay metrics, and returns a draw+dispose API
    const createCameraOverlay = async (opts: {
        selectedCameraId: string | null
        compFps: number
        padding: number
    }) => {
        const { selectedCameraId, compFps, padding } = opts

        let camStream: MediaStream | null = null
        let camVideoEl: HTMLVideoElement | null = null
        let closedCameraForRecording = false

        // Overlay metrics (size and shape), refreshed periodically from the camera window
        let overlayW = 0
        let overlayH = 0
        let overlayRadiusPx = 0

        // Cache for geometry to avoid rebuilding paths each frame unnecessarily
        let clipPath: Path2D | null = null
        let lastOverlayW = overlayW
        let lastOverlayH = overlayH
        let lastRadius = overlayRadiusPx
        let lastVW = 0
        let lastVH = 0
        let drawDX = 0
        let drawDY = 0
        let drawDW = overlayW
        let drawDH = overlayH

        // Helper: apply camera metrics from electron API
        const applyMetrics = (m: {
            width: number
            height: number
            radiusPx: number
            dpr?: number
        }) => {
            const scale = m.dpr || 1
            const w = Math.max(1, Math.round(m.width * scale))
            const h = Math.max(1, Math.round(m.height * scale))
            const r = Math.max(0, Math.round(m.radiusPx * scale))
            if (w >= 16 && h >= 16) {
                overlayW = w
                overlayH = h
                overlayRadiusPx = Math.min(r, Math.floor(Math.min(w, h) / 2))
            }
        }

        // Fetch initial metrics (if available) from the external camera UI
        const { data: metrics } = await tryCatch(window.electronAPI.getCameraMetrics())
        if (metrics) applyMetrics(metrics)

        // Close floating camera window if needed to free the device for raw capture
        if (selectedCameraId) {
            await tryCatch(window.electronAPI.closeCamera())
            closedCameraForRecording = true
        }

        if (selectedCameraId) {
            const constraints = {
                audio: false,
                video: {
                    deviceId: { exact: selectedCameraId },
                    frameRate: { ideal: compFps },
                },
            }

            const { data, error } = await tryCatch(navigator.mediaDevices.getUserMedia(constraints))
            if (error) {
                console.warn("Camera capture failed; proceeding without overlay", error)
            }

            camStream = data
            camVideoEl = document.createElement("video")
            camVideoEl.muted = true
            camVideoEl.playsInline = true
            camVideoEl.autoplay = true
            camVideoEl.srcObject = camStream
            await tryCatch(camVideoEl.play())
        }

        // Periodic metrics refresh to follow camera UI changes in size/shape
        let metricsInterval: number | null = null
        const refreshOverlayMetrics = async () => {
            const { data } = await tryCatch(window.electronAPI.getCameraMetrics())
            if (!data) return
            applyMetrics(data)
        }
        metricsInterval = window.setInterval(refreshOverlayMetrics, 500)

        const updateGeometry = (canvasWidth: number, canvasHeight: number) => {
            if (!camVideoEl) {
                clipPath = null
                return
            }
            if (overlayW < 1 || overlayH < 1) {
                clipPath = null
                return
            }
            const result = computeCameraOverlayGeometry({
                canvasWidth,
                canvasHeight,
                overlayW,
                overlayH,
                overlayRadiusPx,
                padding,
                camVideoW: camVideoEl.videoWidth || overlayW,
                camVideoH: camVideoEl.videoHeight || overlayH,
            })
            clipPath = result.clipPath
            drawDX = result.drawDX
            drawDY = result.drawDY
            drawDW = result.drawDW
            drawDH = result.drawDH
            lastOverlayW = overlayW
            lastOverlayH = overlayH
            lastRadius = overlayRadiusPx
            lastVW = result.srcVW
            lastVH = result.srcVH
        }

        const draw = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
            if (!camVideoEl) return
            const vw = camVideoEl.videoWidth || overlayW
            const vh = camVideoEl.videoHeight || overlayH
            if (
                !clipPath ||
                overlayW !== lastOverlayW ||
                overlayH !== lastOverlayH ||
                overlayRadiusPx !== lastRadius ||
                vw !== lastVW ||
                vh !== lastVH
            ) {
                updateGeometry(canvasWidth, canvasHeight)
            }
            if (overlayW < 1 || overlayH < 1 || !clipPath) return
            ctx.save()
            ctx.clip(clipPath)

            tryCatchSync(ctx.drawImage(camVideoEl, drawDX, drawDY, drawDW, drawDH))
            ctx.restore()
        }

        const dispose = () => {
            if (metricsInterval !== null) {
                clearInterval(metricsInterval)
                metricsInterval = null
            }
        }

        return {
            camStream,
            camVideoEl,
            draw,
            dispose,
            closedCameraForRecording,
        }
    }

    return { createCameraOverlay }
}

export default useCameraOverlay
