import "@fontsource-variable/noto-sans-lao"
import "~/index.css"

import type { RecordConfig } from "~/types/record-config"

import { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "react-aria-components"

import useRecordConfig from "~/hooks/use-record-config"
import { DeleteIcon } from "~/icons/delete"
import { PauseIcon } from "~/icons/pause"
import { PlayIcon } from "~/icons/play"
import { StopIcon } from "~/icons/stop"

interface FloatingBarProps {
    source: RecordConfig["source"]
    selectedMicId: string | null
    selectedCameraId: string | null
    isSystemSoundEnabled: boolean
    isVisible: boolean
    onClose: () => void
}

const FloatingBar = ({
    source,
    selectedMicId,
    selectedCameraId,
    isSystemSoundEnabled,
    isVisible,
    onClose,
}: FloatingBarProps) => {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)

    const [_isStartingRecording, setIsStartingRecording] = useState(false)

    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const screenStreamRef = useRef<MediaStream | null>(null)
    const cameraStreamRef = useRef<MediaStream | null>(null)
    const systemAudioStreamRef = useRef<MediaStream | null>(null)
    const micStreamRef = useRef<MediaStream | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const filePathRef = useRef<string | null>(null)
    const writeQueueRef = useRef<Promise<void>>(Promise.resolve())
    const streamingEnabledRef = useRef<boolean>(false)
    const closedCameraForRecordingRef = useRef<boolean>(false)

    useEffect(() => {
        if (isRecording && !isPaused) {
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1)
            }, 1000)
        } else {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
                recordingTimerRef.current = null
            }
            if (!isRecording) {
                setRecordingTime(0)
            }
        }

        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
        }
    }, [isRecording, isPaused])

    useEffect(() => {
        if (!isRecording && source) {
            void startRecording()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const pickPreferredAudioTrack = (
        screen: MediaStream,
        mic: MediaStream | null,
        mixed?: MediaStreamTrack,
    ) => {
        if (mixed) return mixed
        const screenAudio = screen.getAudioTracks()[0]
        if (screenAudio) return screenAudio
        const micAudio = mic?.getAudioTracks()?.[0]
        return micAudio
    }
    const logDisplayDiagnostics = () => {
        console.log("=== RECORDING DIAGNOSTICS ===")
        console.log("Screen dimensions:", {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            pixelDepth: screen.pixelDepth,
            colorDepth: screen.colorDepth,
        })
        console.log("Device pixel ratio:", window.devicePixelRatio)
    }

    const cleanupStreams = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop())
            screenStreamRef.current = null
        }
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((t) => t.stop())
            cameraStreamRef.current = null
        }
        if (systemAudioStreamRef.current) {
            systemAudioStreamRef.current.getTracks().forEach((t) => t.stop())
            systemAudioStreamRef.current = null
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((t) => t.stop())
            micStreamRef.current = null
        }
        if (audioDestRef.current) {
            audioDestRef.current.stream.getTracks().forEach((t) => t.stop())
            audioDestRef.current = null
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {})
            audioCtxRef.current = null
        }
    }

    const startRecording = async () => {
        if (!window.electronAPI || !source) {
            alert("Recording is not available or source not selected.")
            return
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            return
        }

        setIsStartingRecording(true)

        try {
            logDisplayDiagnostics()
            const recordingConfigStr = await window.electronAPI.startRecording({
                id: source.id,
                name: source.name,
            })
            const recordingConfig = JSON.parse(recordingConfigStr)

            filePathRef.current = recordingConfig.filePath as string
            try {
                await window.electronAPI.openRecordingStream(recordingConfig.filePath)
                streamingEnabledRef.current = true
                writeQueueRef.current = Promise.resolve()
                console.log("Streaming recording enabled (writing to .part)")
            } catch (e) {
                streamingEnabledRef.current = false
                console.warn("Streaming not available, falling back to buffered save:", e)
            }

            let stream: MediaStream
            try {
                stream = await navigator.mediaDevices.getUserMedia(recordingConfig.constraints)
            } catch (primaryError) {
                console.warn("Primary capture method failed, trying fallback:", primaryError)
            }

            // Best-effort: if the primary stream lacks system audio (common for window-only capture),
            // try to acquire a dedicated system loopback audio stream and mix it in.
            let systemAudioStream: MediaStream | null = null
            try {
                if (isSystemSoundEnabled && !stream.getAudioTracks().length) {
                    // Electron/Chromium-specific constraint for system loopback
                    systemAudioStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            mandatory: {
                                chromeMediaSource: "desktop",
                                // Intentionally omit chromeMediaSourceId to request loopback
                            },
                        } as MediaTrackConstraints,
                        video: false,
                    })
                    if (systemAudioStream.getAudioTracks().length) {
                        console.log("Acquired dedicated system audio loopback track")
                    }
                }
            } catch (sysErr) {
                console.warn("System loopback audio not available:", sysErr)
            }
            let micStream: MediaStream | null = null
            try {
                if (selectedMicId) {
                    micStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: { exact: selectedMicId },
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                        video: false,
                    })
                }
            } catch (micErr) {
                console.warn("Microphone capture failed; continuing without mic:", micErr)
            }

            let mixedAudioTrack: MediaStreamTrack | undefined
            try {
                const hasSystemAudio =
                    isSystemSoundEnabled &&
                    (stream.getAudioTracks().length > 0 ||
                        (systemAudioStream?.getAudioTracks().length ?? 0) > 0)

                const hasMicAudio = micStream?.getAudioTracks().length > 0
                if (hasSystemAudio || hasMicAudio) {
                    const audioCtx = new window.AudioContext()
                    audioCtxRef.current = audioCtx
                    const dest = audioCtx.createMediaStreamDestination()
                    audioDestRef.current = dest

                    // Add system audio from primary stream, if present
                    const primarySysTracks = isSystemSoundEnabled ? stream.getAudioTracks() : []
                    if (primarySysTracks.length > 0) {
                        const systemAudioOnly = new MediaStream(primarySysTracks)
                        const sysSource = audioCtx.createMediaStreamSource(systemAudioOnly)
                        sysSource.connect(dest)
                    }
                    // Or add system loopback stream if that was acquired
                    const loopbackTracks = isSystemSoundEnabled
                        ? (systemAudioStream?.getAudioTracks() ?? [])
                        : []
                    if (loopbackTracks.length > 0) {
                        const loopbackOnly = new MediaStream(loopbackTracks)
                        const loopSource = audioCtx.createMediaStreamSource(loopbackOnly)
                        loopSource.connect(dest)
                    }
                    if (hasMicAudio) {
                        const micAudioOnly = new MediaStream(micStream!.getAudioTracks())
                        const micSource = audioCtx.createMediaStreamSource(micAudioOnly)
                        micSource.connect(dest)
                    }

                    mixedAudioTrack = dest.stream.getAudioTracks()[0]
                }
            } catch (mixErr) {
                console.warn(
                    "Audio mixing failed; will fallback to available audio tracks:",
                    mixErr,
                )
            }

            let preferredAudio: MediaStreamTrack | undefined
            if (isSystemSoundEnabled || (micStream && micStream.getAudioTracks().length)) {
                preferredAudio = pickPreferredAudioTrack(stream, micStream, mixedAudioTrack)
            }
            // Compose screen + optional camera overlay into a canvas and capture it
            const screenVideoTrack = stream.getVideoTracks()[0]
            const s = screenVideoTrack?.getSettings ? screenVideoTrack.getSettings() : {}
            // Start with unknown canvas dimensions; we will set these to the
            // native captured source dimensions once metadata is available.
            let canvasWidth = s.width ?? 0
            let canvasHeight = s.height ?? 0
            const compFps = s.frameRate ?? 30

            const canvas = document.createElement("canvas")
            // Temporarily set a minimal size to avoid 0x0 canvas issues
            canvas.width = canvasWidth || 2
            canvas.height = canvasHeight || 2
            const ctx = canvas.getContext("2d")!

            const screenVideoEl = document.createElement("video")
            screenVideoEl.muted = true
            screenVideoEl.playsInline = true
            screenVideoEl.autoplay = true
            screenVideoEl.srcObject = stream
            try {
                await screenVideoEl.play()
            } catch {}

            // Ensure the output canvas exactly matches the captured source dimensions.
            // This guarantees the recorded video resolution equals the screen/window size.
            const applyNativeCanvasSize = () => {
                const vw = screenVideoEl.videoWidth
                const vh = screenVideoEl.videoHeight
                if (vw && vh && (vw !== canvasWidth || vh !== canvasHeight)) {
                    canvasWidth = vw
                    canvasHeight = vh
                    canvas.width = canvasWidth
                    canvas.height = canvasHeight
                }
            }
            // Wait for metadata if needed, then set the canvas size.
            if (!screenVideoEl.videoWidth || !screenVideoEl.videoHeight) {
                await new Promise<void>((resolve) => {
                    const onReady = () => {
                        try {
                            applyNativeCanvasSize()
                        } finally {
                            resolve()
                        }
                    }
                    try {
                        if (screenVideoEl.readyState >= 1) onReady()
                        else screenVideoEl.onloadedmetadata = onReady
                    } catch {
                        // If anything goes wrong, fall back to settings or 1080p
                        canvasWidth = canvasWidth || s.width || 1920
                        canvasHeight = canvasHeight || s.height || 1080
                        canvas.width = canvasWidth
                        canvas.height = canvasHeight
                        resolve()
                    }
                })
            } else {
                applyNativeCanvasSize()
            }

            // Also react to dynamic size changes on the captured track when possible
            try {
                // Not all environments fire this, but harmless if unsupported
                ;(screenVideoEl as HTMLVideoElement).onresize = () => applyNativeCanvasSize()
            } catch {}

            let camStream: MediaStream | null = null
            let camVideoEl: HTMLVideoElement | null = null
            try {
                // Always use the raw camera device for overlay to avoid black background from window capture.
                // If the floating camera window is open, close it temporarily to free the device.
                try {
                    if (selectedCameraId) {
                        await window.electronAPI.closeCamera?.()
                        closedCameraForRecordingRef.current = true
                    }
                } catch {}

                if (selectedCameraId) {
                    camStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: selectedCameraId },
                            // Avoid width/height constraints to preserve native aspect ratio
                            // Draw logic will scale+clip to the overlay without stretching
                            frameRate: { ideal: compFps },
                        },
                        audio: false,
                    })
                }

                if (camStream) {
                    camVideoEl = document.createElement("video")
                    camVideoEl.muted = true
                    camVideoEl.playsInline = true
                    camVideoEl.autoplay = true
                    camVideoEl.srcObject = camStream
                    try {
                        await camVideoEl.play()
                    } catch {}
                }
            } catch (e) {
                console.warn("Camera capture failed; proceeding without overlay", e)
            }

            const padding = 24 // px
            // Match camera.tsx base size (size-50 ≈ 200px)
            let overlayW = 0
            let overlayH = 0
            let overlayRadiusPx = 0

            try {
                const metrics = await window.electronAPI.getCameraMetrics?.()
                if (metrics) {
                    const scale = metrics.dpr || 1
                    const w = Math.max(1, Math.round(metrics.width * scale))
                    const h = Math.max(1, Math.round(metrics.height * scale))
                    const r = Math.max(0, Math.round(metrics.radiusPx * scale))
                    if (w >= 16 && h >= 16) {
                        overlayW = w
                        overlayH = h
                        overlayRadiusPx = Math.min(r, Math.floor(Math.min(w, h) / 2))
                    }
                }
            } catch {
                // ignore and use defaults
            }

            // Periodically refresh overlay metrics so recording matches visible camera changes
            let metricsInterval: number | null = null
            const refreshOverlayMetrics = async () => {
                try {
                    const m = await window.electronAPI.getCameraMetrics?.()
                    if (!m) return
                    const scale = m.dpr || 1
                    const w = Math.max(1, Math.round(m.width * scale))
                    const h = Math.max(1, Math.round(m.height * scale))
                    const r = Math.max(0, Math.round(m.radiusPx * scale))
                    if (w >= 16 && h >= 16) {
                        overlayW = w
                        overlayH = h
                        overlayRadiusPx = Math.min(r, Math.floor(Math.min(w, h) / 2))
                    }
                } catch {}
            }
            metricsInterval = window.setInterval(refreshOverlayMetrics, 500)

            // Cache overlay geometry/clip path for better performance
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

            const updateGeometry = () => {
                // Defer drawing until camera metrics provide valid dimensions
                if (overlayW < 1 || overlayH < 1) {
                    clipPath = null
                    return
                }
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
                clipPath = p

                const vw = camVideoEl?.videoWidth || overlayW
                const vh = camVideoEl?.videoHeight || overlayH
                const scale = Math.max(overlayW / vw, overlayH / vh)
                drawDW = vw * scale
                drawDH = vh * scale
                drawDX = x + (overlayW - drawDW) / 2
                drawDY = y + (overlayH - drawDH) / 2

                lastOverlayW = overlayW
                lastOverlayH = overlayH
                lastRadius = overlayRadiusPx
                lastVW = vw
                lastVH = vh
            }

            // Compute screen draw geometry (contain) to avoid stretching
            let lastCanvasW = canvasWidth
            let lastCanvasH = canvasHeight
            let lastScreenVW = 0
            let lastScreenVH = 0
            let screenDX = 0
            let screenDY = 0
            let screenDW = canvasWidth
            let screenDH = canvasHeight

            const updateScreenGeometry = () => {
                const vw = screenVideoEl.videoWidth || canvasWidth
                const vh = screenVideoEl.videoHeight || canvasHeight
                // Contain: preserve AR and letterbox/pillarbox to canvas
                const scale = Math.min(canvasWidth / vw, canvasHeight / vh)
                screenDW = Math.max(1, Math.round(vw * scale))
                screenDH = Math.max(1, Math.round(vh * scale))
                screenDX = Math.floor((canvasWidth - screenDW) / 2)
                screenDY = Math.floor((canvasHeight - screenDH) / 2)
                lastCanvasW = canvasWidth
                lastCanvasH = canvasHeight
                lastScreenVW = vw
                lastScreenVH = vh
            }

            // Initialize screen geometry once video has metadata
            try {
                if (screenVideoEl.readyState >= 1) updateScreenGeometry()
                else screenVideoEl.onloadedmetadata = () => updateScreenGeometry()
            } catch {}

            const targetMs = 1000 / Math.min(24, Math.max(1, compFps))
            let lastDraw = 0

            const doDraw = (now: number) => {
                if (now - lastDraw < targetMs - 1) return
                lastDraw = now
                try {
                    // Update geometry if canvas or source dims changed
                    const vw = screenVideoEl.videoWidth || canvasWidth
                    const vh = screenVideoEl.videoHeight || canvasHeight
                    if (
                        canvasWidth !== lastCanvasW ||
                        canvasHeight !== lastCanvasH ||
                        vw !== lastScreenVW ||
                        vh !== lastScreenVH
                    ) {
                        updateScreenGeometry()
                    }
                    // Clear with black to avoid transparent edges in output
                    ctx.save()
                    ctx.fillStyle = "#000"
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
                    ctx.restore()
                    // Draw the screen video letterboxed
                    ctx.drawImage(screenVideoEl, screenDX, screenDY, screenDW, screenDH)
                } catch {}
                if (camVideoEl) {
                    // Refresh cached geometry if anything changed
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
                        updateGeometry()
                    }
                    if (overlayW >= 1 && overlayH >= 1 && clipPath) {
                        ctx.save()
                        ctx.clip(clipPath)
                        try {
                            ctx.drawImage(camVideoEl, drawDX, drawDY, drawDW, drawDH)
                        } catch {}
                        ctx.restore()
                    }
                }
            }

            const anyVideo = screenVideoEl
            if (typeof anyVideo.requestVideoFrameCallback === "function") {
                const onFrame = (_now: number) => {
                    doDraw(performance.now())
                    anyVideo.requestVideoFrameCallback(onFrame)
                }
                anyVideo.requestVideoFrameCallback(onFrame)
            } else {
                const loop = (now: number) => {
                    doDraw(now)
                    requestAnimationFrame(loop)
                }
                requestAnimationFrame(loop)
            }

            const canvasStream = canvas.captureStream(Math.min(30, compFps))
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...(preferredAudio ? [preferredAudio] : []),
            ])

            screenStreamRef.current = stream
            cameraStreamRef.current = camStream
            systemAudioStreamRef.current = systemAudioStream
            micStreamRef.current = micStream
            streamRef.current = combinedStream

            let mimeType = "video/mp4;codecs=vp9"
            let videoBitrate = 8000000

            console.log("=== CODEC DIAGNOSTICS ===")
            console.log("VP8 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=vp8"))
            console.log("H264 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=h264"))
            console.log("VP9 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=vp9"))

            if (MediaRecorder.isTypeSupported("video/mp4;codecs=vp9")) {
                mimeType = "video/mp4;codecs=vp9"
                console.log("Selected codec: VP9 (preferred)")
            } else if (MediaRecorder.isTypeSupported("video/mp4;codecs=vp8")) {
                mimeType = "video/mp4;codecs=vp8"
                console.log("Selected codec: VP8 (fallback)")
            } else if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264")) {
                mimeType = "video/mp4;codecs=h264"
                console.log("Selected codec: H264-in-mp4 (last resort)")
            }

            const videoTrack = stream.getVideoTracks()[0]
            const settings = videoTrack?.getSettings ? videoTrack.getSettings() : {}
            const width = settings.width ?? 1920
            const height = settings.height ?? 1080
            const fps = settings.frameRate ?? 30

            const targetBpppf = 0.1
            const computed = Math.round(width * height * fps * targetBpppf)

            videoBitrate = Math.min(Math.max(computed, 8_000_000), 25_000_000)
            console.log("Dynamic bitrate (bps):", videoBitrate, {
                width,
                height,
                fps,
            })

            console.log("Final recording settings:", {
                mimeType,
                videoBitrate: `${videoBitrate / 1000000} Mbps`,
                audioBitrate: "192 kbps",
                dataCollectionInterval: "500ms - REDUCED FOR SMOOTH CURSOR",
            })

            const mediaRecorder = new MediaRecorder(streamRef.current!, {
                mimeType,
                videoBitsPerSecond: videoBitrate,
                audioBitsPerSecond: 192000,
            })
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = async (event) => {
                try {
                    if (!event.data || event.data.size <= 0) return

                    if (streamingEnabledRef.current && filePathRef.current) {
                        const doWrite = async () => {
                            const ab = await event.data.arrayBuffer()
                            const uint8 = new Uint8Array(ab)
                            await window.electronAPI.writeRecordingChunk(
                                filePathRef.current!,
                                uint8,
                            )
                        }
                        writeQueueRef.current = writeQueueRef.current.then(doWrite).catch((err) => {
                            console.error("Streaming write error:", err)
                        })
                    } else {
                        chunksRef.current.push(event.data)
                    }
                } catch (e) {
                    console.error("Chunk handling error:", e)
                }
            }

            mediaRecorder.onerror = async (event) => {
                console.error("MediaRecorder error:", event)
                setIsRecording(false)
                setRecordingTime(0)

                cleanupStreams()

                try {
                    try {
                        if (metricsInterval !== null) {
                            clearInterval(metricsInterval)
                            metricsInterval = null
                        }
                    } catch {}
                    if (streamingEnabledRef.current && filePathRef.current) {
                        await writeQueueRef.current
                        await window.electronAPI.closeRecordingStream(filePathRef.current)
                        await window.electronAPI.deletePartialRecording(filePathRef.current)
                    }
                } catch (cleanupErr) {
                    console.warn("Cleanup after error failed:", cleanupErr)
                } finally {
                    streamingEnabledRef.current = false
                }
                alert("�?O Recording error occurred. This may be due to capture issues.")
            }

            mediaRecorder.onstop = async () => {
                try {
                    if (streamingEnabledRef.current && filePathRef.current) {
                        await writeQueueRef.current
                        const finalPath = await window.electronAPI.finalizeRecordingStream(
                            filePathRef.current,
                        )
                        alert(`�o. Recording saved: ${finalPath}`)
                        if (window.electronAPI.openFolder) {
                            window.electronAPI.openFolder(finalPath)
                        }
                    } else {
                        const blob = new Blob(chunksRef.current, {
                            type: mimeType,
                        })
                        chunksRef.current = []
                        const arrayBuffer = await blob.arrayBuffer()
                        const uint8 = new Uint8Array(arrayBuffer)
                        const msg = await window.electronAPI.saveRecording(
                            recordingConfig.filePath,
                            uint8,
                        )
                        console.log(msg)
                        alert(`�o. Recording saved: ${recordingConfig.filePath}`)
                        if (window.electronAPI.openFolder) {
                            window.electronAPI.openFolder(recordingConfig.filePath)
                        }
                    }
                } catch (err) {
                    console.error("Save recording error:", err)
                    alert(`�?O Failed to save recording: ${err}`)
                } finally {
                    try {
                        if (metricsInterval !== null) {
                            clearInterval(metricsInterval)
                            metricsInterval = null
                        }
                    } catch {}
                    // Re-open the camera overlay window if we closed it for recording
                    try {
                        if (closedCameraForRecordingRef.current && selectedCameraId) {
                            await window.electronAPI.openCamera(selectedCameraId)
                        }
                    } catch {}
                    closedCameraForRecordingRef.current = false

                    setIsRecording(false)
                    setIsPaused(false)
                    setRecordingTime(0)
                    onClose()
                    streamingEnabledRef.current = false
                    filePathRef.current = null
                }
            }

            console.log("=== RECORDING START DIAGNOSTICS ===")
            console.log("MediaRecorder state:", mediaRecorder.state)
            console.log(
                "Stream tracks:",
                streamRef.current?.getTracks().map((track) => ({
                    kind: track.kind,
                    label: track.label,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    settings: track.getSettings ? track.getSettings() : "N/A",
                })),
            )

            mediaRecorder.start(500)
            setIsRecording(true)
            setRecordingTime(0)
            setIsStartingRecording(false)

            console.log(`�o. Recording started for: ${source.name}`)
            console.log("�o. OPTIMIZED: Using 500ms data collection interval for smooth cursor!")
        } catch (error) {
            console.error("Error starting recording:", error)
            setIsStartingRecording(false)
            alert(
                `�?O Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop()
        } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            try {
                mediaRecorderRef.current.stop()
            } catch {}
        }
        cleanupStreams()
    }

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            try {
                mediaRecorderRef.current.pause()
                setIsPaused(true)
            } catch (e) {
                console.warn("Pause failed or unsupported:", e)
            }
        }
    }

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            try {
                mediaRecorderRef.current.resume()
                setIsPaused(false)
            } catch (e) {
                console.warn("Resume failed or unsupported:", e)
            }
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    if (!isVisible) return null

    return (
        <main className="grid size-max gap-4 overflow-hidden p-2">
            <section
                className="bg-background shadow-cursor flex items-center overflow-x-hidden rounded-2xl py-3 pr-4 pl-3"
                style={{ WebkitAppRegion: "drag" }}
            >
                <div className="grid shrink-0 place-items-center gap-2 rounded-md py-0.5 text-left text-sm font-medium whitespace-nowrap text-red-600">
                    {formatTime(recordingTime || 0)}
                </div>

                <div className="mx-4 h-3/4 border-r"></div>

                <div className="flex items-center gap-4">
                    <Button style={{ WebkitAppRegion: "no-drag" }} onPress={() => stopRecording()}>
                        <StopIcon className="size-5 text-red-600" />
                    </Button>

                    {!isRecording || isPaused ? (
                        <Button onPress={resumeRecording} style={{ WebkitAppRegion: "no-drag" }}>
                            <PlayIcon className="size-5" />
                        </Button>
                    ) : (
                        <Button onPress={pauseRecording} style={{ WebkitAppRegion: "no-drag" }}>
                            <PauseIcon className="size-5" />
                        </Button>
                    )}
                </div>

                <div className="mx-4 h-3/4 border-r"></div>

                <Button style={{ WebkitAppRegion: "no-drag" }}>
                    <DeleteIcon className="size-5" />
                </Button>
            </section>
        </main>
    )
}

const RecordBar = () => {
    const { config, isLoading } = useRecordConfig()

    const handleClose = () => {
        window.electronAPI.closeRecordBar()
        window.electronAPI.closeCamera()
    }

    if (!config || isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-transparent">
                <div className="text-sm text-white">Waiting for source selection...</div>
            </div>
        )
    }

    return (
        <div className="flex h-full w-full items-center justify-center bg-transparent">
            <FloatingBar
                source={config.source}
                selectedMicId={config.selectedMicId}
                selectedCameraId={config.selectedCameraId}
                isSystemSoundEnabled={config.isSystemSoundEnabled}
                isVisible={!isLoading}
                onClose={handleClose}
            />
        </div>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<RecordBar />)
