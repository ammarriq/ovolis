import type { ScreenSource } from "~/types/screen-sources"
import { useEffect, useRef, useState } from "react"

interface FloatingBarProps {
    source: ScreenSource
    isVisible: boolean
    onClose: () => void
    onSourceChange: (source: ScreenSource | null) => void
}

const FloatingBar = ({ source, isVisible, onClose, onSourceChange }: FloatingBarProps) => {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    // Removed FFmpeg conversion state
    const [isStartingRecording, setIsStartingRecording] = useState(false)

    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const screenStreamRef = useRef<MediaStream | null>(null)
    const micStreamRef = useRef<MediaStream | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const filePathRef = useRef<string | null>(null)
    const writeQueueRef = useRef<Promise<void>>(Promise.resolve())
    const streamingEnabledRef = useRef<boolean>(false)

    useEffect(() => {
        if (isRecording) {
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1)
            }, 1000)
        } else {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
                recordingTimerRef.current = null
            }
            setRecordingTime(0)
        }

        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
        }
    }, [isRecording])

    const startRecording = async () => {
        if (!window.electronAPI || !source) {
            alert("Recording is not available or source not selected.")
            return
        }

        setIsStartingRecording(true)
        try {
            // DIAGNOSTIC: Log display information
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

            // Get recording configuration
            const recordingConfigStr = await window.electronAPI.startRecording({
                id: source.id,
                name: source.name,
            })
            const recordingConfig = JSON.parse(recordingConfigStr)
            console.log("Recording config:", recordingConfig)

            // Open streaming write on main process to save chunks as they arrive
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

            // Start actual recording with fallback mechanism
            let stream: MediaStream
            try {
                // Try primary capture method
                stream = await navigator.mediaDevices.getUserMedia(recordingConfig.constraints)
            } catch (primaryError) {
                console.warn("Primary capture method failed, trying fallback:", primaryError)
            }
            // Capture microphone audio separately
            let micStream: MediaStream | null = null
            try {
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                })
            } catch (micErr) {
                console.warn("Microphone capture failed; continuing without mic:", micErr)
            }

            // Mix system (desktop) audio with mic using Web Audio API
            let mixedAudioTrack: MediaStreamTrack | undefined
            try {
                const hasSystemAudio = stream.getAudioTracks().length > 0
                const hasMicAudio = micStream?.getAudioTracks().length
                if (hasSystemAudio || hasMicAudio) {
                    const audioCtx = new (window.AudioContext ||
                        (window as any).webkitAudioContext)()
                    audioCtxRef.current = audioCtx
                    const dest = audioCtx.createMediaStreamDestination()
                    audioDestRef.current = dest

                    if (hasSystemAudio) {
                        // Create an audio-only MediaStream for system audio source
                        const systemAudioOnly = new MediaStream(stream.getAudioTracks())
                        const sysSource = audioCtx.createMediaStreamSource(systemAudioOnly)
                        sysSource.connect(dest)
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

            // Build final combined stream: screen video + mixed audio (or fallback to system/mic audio)
            const combinedTracks: MediaStreamTrack[] = [
                ...stream.getVideoTracks(),
                ...(mixedAudioTrack
                    ? [mixedAudioTrack]
                    : stream.getAudioTracks().length > 0
                      ? [stream.getAudioTracks()[0]]
                      : micStream?.getAudioTracks()?.length
                        ? [micStream!.getAudioTracks()[0]]
                        : []),
            ]
            const combinedStream = new MediaStream(combinedTracks)

            // Keep references for cleanup
            screenStreamRef.current = stream
            micStreamRef.current = micStream
            streamRef.current = combinedStream

            // Use mp4 format with high-quality codec selection
            let mimeType = "video/mp4;codecs=vp9"
            let videoBitrate = 8000000 // default 8 Mbps, will adjust dynamically

            // DIAGNOSTIC: Log codec support
            console.log("=== CODEC DIAGNOSTICS ===")
            console.log("VP8 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=vp8"))
            console.log("H264 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=h264"))
            console.log("VP9 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=vp9"))

            // Prefer VP9 > VP8 > H264-in-mp4 (if available)
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

            // Dynamically scale bitrate based on captured resolution/FPS
            const videoTrack = stream.getVideoTracks()[0]
            const settings = videoTrack?.getSettings ? videoTrack.getSettings() : {}
            const width = (settings as any).width ?? 1920
            const height = (settings as any).height ?? 1080
            const fps = (settings as any).frameRate ?? 30

            // Heuristic: bits-per-pixel-per-frame ~0.1 for high quality desktop capture
            const targetBpppf = 0.1
            const computed = Math.round(width * height * fps * targetBpppf)

            // Clamp to sane range: 8 Mbps (1080p) up to 25 Mbps (4K60)
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

            // Collect MediaRecorder chunks: stream to disk if enabled, else buffer
            mediaRecorder.ondataavailable = async (event) => {
                try {
                    if (event.data && event.data.size > 0) {
                        if (streamingEnabledRef.current && filePathRef.current) {
                            const doWrite = async () => {
                                const ab = await event.data.arrayBuffer()
                                const uint8 = new Uint8Array(ab)
                                await window.electronAPI.writeRecordingChunk(
                                    filePathRef.current!,
                                    uint8,
                                )
                            }
                            // Chain writes to keep order
                            writeQueueRef.current = writeQueueRef.current
                                .then(doWrite)
                                .catch((err) => {
                                    console.error("Streaming write error:", err)
                                })
                        } else {
                            // Fallback: keep in memory
                            chunksRef.current.push(event.data)
                        }
                    }
                } catch (e) {
                    console.error("Chunk handling error:", e)
                }
            }

            mediaRecorder.onerror = async (event) => {
                console.error("MediaRecorder error:", event)
                setIsRecording(false)
                setRecordingTime(0)

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop())
                    streamRef.current = null
                }
                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach((t) => t.stop())
                    screenStreamRef.current = null
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
                    try {
                        await audioCtxRef.current.close()
                    } catch {}
                    audioCtxRef.current = null
                }

                // Clean up partial stream/file if streaming was active
                try {
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
                alert("❌ Recording error occurred. This may be due to capture issues.")
            }

            mediaRecorder.onstop = async () => {
                try {
                    if (streamingEnabledRef.current && filePathRef.current) {
                        // Ensure all pending writes flushed
                        await writeQueueRef.current
                        const finalPath = await window.electronAPI.finalizeRecordingStream(
                            filePathRef.current,
                        )
                        alert(`✅ Recording saved: ${finalPath}`)
                        if (window.electronAPI.openFolder) {
                            window.electronAPI.openFolder(finalPath)
                        }
                    } else {
                        // Fallback: save buffered blob
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
                        alert(`✅ Recording saved: ${recordingConfig.filePath}`)
                        if (window.electronAPI.openFolder) {
                            window.electronAPI.openFolder(recordingConfig.filePath)
                        }
                    }
                } catch (err) {
                    console.error("Save recording error:", err)
                    alert(`❌ Failed to save recording: ${err}`)
                } finally {
                    setIsRecording(false)
                    setRecordingTime(0)
                    onSourceChange(null)
                    onClose()
                    streamingEnabledRef.current = false
                    filePathRef.current = null
                }
            }

            // Start recording with diagnostic logging
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

            mediaRecorder.start(500) // Larger timeslice to reduce cursor stuttering
            setIsRecording(true)
            setRecordingTime(0)
            setIsStartingRecording(false)

            console.log(`✅ Recording started for: ${source.name}`)
            console.log("✅ OPTIMIZED: Using 500ms data collection interval for smooth cursor!")
        } catch (error) {
            console.error("Error starting recording:", error)
            setIsStartingRecording(false)
            alert(
                `❌ Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop()
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop())
            screenStreamRef.current = null
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

        // Reset state will be handled in mediaRecorder.onstop
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    if (!isVisible) return null

    return (
        <div className="z-50 flex flex-col gap-3">
            {/* Main floating bar */}
            <div className="flex items-center gap-4 rounded-full border border-white/20 bg-black/80 px-6 py-3 shadow-lg backdrop-blur-sm">
                {/* Source name */}
                <div className="text-sm font-medium text-white" style={{ WebkitAppRegion: "drag" }}>
                    {source.name}
                </div>

                {/* Recording indicator and timer */}
                {isRecording && (
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                        <span className="font-mono text-sm text-white">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                )}

                {/* Conversion status removed */}

                {/* Record/Stop buttons */}
                {!isRecording ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!isStartingRecording) {
                                startRecording()
                            }
                        }}
                        disabled={isStartingRecording}
                        className={`${
                            isStartingRecording
                                ? "cursor-not-allowed bg-gray-500"
                                : "cursor-pointer bg-red-600 hover:bg-red-700"
                        } flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors duration-200`}
                    >
                        <div
                            className={`h-3 w-3 ${isStartingRecording ? "animate-pulse bg-gray-300" : "bg-white"} rounded-full`}
                        ></div>
                        {isStartingRecording ? "Starting..." : "Start Recording"}
                    </button>
                ) : isRecording ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            stopRecording()
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-full bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-700"
                        style={{ cursor: "pointer" }}
                    >
                        <div className="h-3 w-3 bg-white"></div>
                        Stop Recording
                    </button>
                ) : (
                    <div className="px-4 py-2 text-sm text-white">Processing...</div>
                )}
            </div>
        </div>
    )
}

export default FloatingBar
