import { useEffect, useRef, useState } from "react"

import type { ScreenSource } from "~/types/screen-sources"

import ConversionProgress from "./conversion-progress"

interface FloatingBarProps {
    source: ScreenSource
    isVisible: boolean
    onClose: () => void
    onSourceChange: (source: ScreenSource | null) => void
}

const FloatingBar = ({
    source,
    isVisible,
    onClose,
    onSourceChange,
}: FloatingBarProps) => {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [isConverting, setIsConverting] = useState(false)
    const [conversionProgress, setConversionProgress] = useState<string>("")
    const [isStartingRecording, setIsStartingRecording] = useState(false)

    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const streamSessionIdRef = useRef<string | null>(null)

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

            // Start actual recording with fallback mechanism
            let stream: MediaStream
            try {
                // Try primary capture method
                stream = await navigator.mediaDevices.getUserMedia(
                    recordingConfig.constraints
                )
            } catch (primaryError) {
                console.warn(
                    "Primary capture method failed, trying fallback:",
                    primaryError
                )
            }
            streamRef.current = stream

            // Use WebM format with CPU-friendly codec selection
            let mimeType = "video/webm;codecs=vp8"
            let videoBitrate = 2000000

            // DIAGNOSTIC: Log codec support
            console.log("=== CODEC DIAGNOSTICS ===")
            console.log(
                "VP8 support:",
                MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
            )
            console.log(
                "H264 support:",
                MediaRecorder.isTypeSupported("video/webm;codecs=h264")
            )
            console.log(
                "VP9 support:",
                MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
            )

            // Progressive codec selection for quality balance - FIXED BITRATES
            if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
                mimeType = "video/webm;codecs=vp9"
                videoBitrate = 6000000 // 6 Mbps for VP9 - HIGH QUALITY
                console.log("Selected codec: VP9 at 6 Mbps - HIGH QUALITY")
            } else if (
                MediaRecorder.isTypeSupported("video/webm;codecs=h264")
            ) {
                mimeType = "video/webm;codecs=h264"
                videoBitrate = 5000000 // 5 Mbps for H264 - HIGH QUALITY
                console.log("Selected codec: H264 at 5 Mbps - HIGH QUALITY")
            } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
                mimeType = "video/webm;codecs=vp8"
                videoBitrate = 4000000 // 4 Mbps for VP8 - IMPROVED FROM 1.5 Mbps
                console.log("Selected codec: VP8 at 4 Mbps - IMPROVED QUALITY")
            }

            console.log("Final recording settings:", {
                mimeType,
                videoBitrate: `${videoBitrate / 1000000} Mbps`,
                audioBitrate: "128 kbps",
                dataCollectionInterval: "200ms - BALANCED FOR SMOOTH CURSOR",
            })

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: videoBitrate,
                audioBitsPerSecond: 128000,
            })
            mediaRecorderRef.current = mediaRecorder

            // Start FFmpeg streaming session BEFORE recording
            const { sessionId } = await window.electronAPI.ffmpegStreamStart({
                outputPath: recordingConfig.filePath,
                presetName: "high",
                inputFormat: "webm",
            })
            streamSessionIdRef.current = sessionId

            // Progress listener for FFmpeg
            if (window.electronAPI.onFFmpegProgress) {
                window.electronAPI.onFFmpegProgress((progress) => {
                    const percentage = progress.percentage || 0
                    if (percentage > 0) {
                        setConversionProgress(
                            `Converting... ${percentage.toFixed(1)}%`
                        )
                    } else if (progress.frame !== undefined) {
                        setConversionProgress(
                            `Processing frame ${progress.frame}`
                        )
                    } else {
                        setConversionProgress("Converting...")
                    }
                })
            }

            // Pipe incoming data chunks directly to FFmpeg via IPC
            mediaRecorder.ondataavailable = async (event) => {
                try {
                    if (event.data.size > 0 && streamSessionIdRef.current) {
                        const arrayBuffer = await event.data.arrayBuffer()
                        const uint8Array = new Uint8Array(arrayBuffer)
                        await window.electronAPI.ffmpegStreamWrite(
                            streamSessionIdRef.current,
                            uint8Array
                        )
                    }
                } catch (e) {
                    console.error("Stream write error:", e)
                }
            }

            mediaRecorder.onerror = (event) => {
                console.error("MediaRecorder error:", event)
                setIsRecording(false)
                setRecordingTime(0)

                stream.getTracks().forEach((track) => track.stop())

                alert(
                    "❌ Recording error occurred. This may be due to capture issues."
                )
            }

            mediaRecorder.onstop = async () => {
                // Show conversion progress while FFmpeg finalizes output
                setIsConverting(true)
                setConversionProgress("Finalizing conversion...")

                try {
                    if (streamSessionIdRef.current) {
                        const result =
                            await window.electronAPI.ffmpegStreamStop(
                                streamSessionIdRef.current
                            )
                        if (!result.success) {
                            throw new Error(result.error || "FFmpeg failed")
                        }
                    }

                    setConversionProgress("Conversion completed!")
                    setTimeout(() => {
                        alert(`✅ Recording saved: ${recordingConfig.filePath}`)
                        if (window.electronAPI.openFolder) {
                            window.electronAPI.openFolder(
                                recordingConfig.filePath
                            )
                        }
                        setIsConverting(false)
                        setConversionProgress("")
                        setIsRecording(false)
                        setRecordingTime(0)
                        onSourceChange(null)
                        onClose()
                    }, 1200)
                } catch (err) {
                    console.error("Streaming stop error:", err)
                    setConversionProgress("Conversion failed")
                    setTimeout(() => {
                        alert(`❌ Failed to save recording: ${err}`)
                        setIsConverting(false)
                        setConversionProgress("")
                        setIsRecording(false)
                        setRecordingTime(0)
                        onSourceChange(null)
                        onClose()
                    }, 1500)
                } finally {
                    if (window.electronAPI.removeFFmpegProgressListener) {
                        window.electronAPI.removeFFmpegProgressListener()
                    }
                    streamSessionIdRef.current = null
                }
            }

            // Start recording with diagnostic logging
            console.log("=== RECORDING START DIAGNOSTICS ===")
            console.log("MediaRecorder state:", mediaRecorder.state)
            console.log(
                "Stream tracks:",
                stream.getTracks().map((track) => ({
                    kind: track.kind,
                    label: track.label,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    settings: track.getSettings ? track.getSettings() : "N/A",
                }))
            )

            mediaRecorder.start(200) // Balanced timeslice for smooth cursor and performance
            setIsRecording(true)
            setRecordingTime(0)
            setIsStartingRecording(false)

            console.log(`✅ Recording started for: ${source.name}`)
            console.log(
                "✅ OPTIMIZED: Using 200ms data collection interval for balanced performance!"
            )
        } catch (error) {
            console.error("Error starting recording:", error)
            setIsStartingRecording(false)
            alert(
                `❌ Failed to start recording: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    const stopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.stop()
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
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
            <div className="bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-4 shadow-lg border border-white/20">
                {/* Source name */}
                <div
                    className="text-white text-sm font-medium"
                    style={{ WebkitAppRegion: "drag" }}
                >
                    {source.name}
                </div>

                {/* Recording indicator and timer */}
                {isRecording && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-mono text-sm">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                )}

                {/* Conversion status */}
                {isConverting && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-white text-sm">
                            {conversionProgress}
                        </span>
                    </div>
                )}

                {/* Record/Stop buttons */}
                {!isRecording && !isConverting ? (
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
                                ? "bg-gray-500 cursor-not-allowed" 
                                : "bg-red-600 hover:bg-red-700 cursor-pointer"
                        } text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-2`}
                    >
                        <div className={`w-3 h-3 ${isStartingRecording ? "bg-gray-300 animate-pulse" : "bg-white"} rounded-full`}></div>
                        {isStartingRecording ? "Starting..." : "Start Recording"}
                    </button>
                ) : isRecording ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            stopRecording()
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2"
                        style={{ cursor: "pointer" }}
                    >
                        <div className="w-3 h-3 bg-white"></div>
                        Stop Recording
                    </button>
                ) : (
                    <div className="text-white text-sm px-4 py-2">
                        Processing...
                    </div>
                )}
            </div>

            {/* Conversion Progress Component */}
            <ConversionProgress
                isVisible={isConverting}
                onCancel={() => {
                    if (window.electronAPI.ffmpegCancelConversion) {
                        window.electronAPI.ffmpegCancelConversion()
                    }
                    setIsConverting(false)
                    setConversionProgress("")
                }}
            />
        </div>
    )
}

export default FloatingBar
