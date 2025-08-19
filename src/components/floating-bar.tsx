import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useRef, useState } from "react"

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

    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

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

        try {
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

            // Progressive codec selection for quality balance
            if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
                mimeType = "video/webm;codecs=vp8"
                videoBitrate = 1500000 // 1.5 Mbps for VP8
            } else if (
                MediaRecorder.isTypeSupported("video/webm;codecs=h264")
            ) {
                mimeType = "video/webm;codecs=h264"
                videoBitrate = 2000000 // 2 Mbps for H264
            } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
                mimeType = "video/webm;codecs=vp9"
                videoBitrate = 2500000 // 2.5 Mbps for VP9
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: videoBitrate,
                audioBitsPerSecond: 128000,
            })
            mediaRecorderRef.current = mediaRecorder

            const chunks: Blob[] = []
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data)
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
                const blob = new Blob(chunks, { type: "video/mp4" })
                const arrayBuffer = await blob.arrayBuffer()
                const uint8Array = new Uint8Array(arrayBuffer)

                try {
                    const saveResult = await window.electronAPI.saveRecording(
                        recordingConfig.filePath,
                        uint8Array
                    )
                    console.log("Save result:", saveResult)
                    alert(`✅ Recording saved: ${saveResult}`)

                    // Open the folder where recordings are saved
                    if (window.electronAPI.openFolder) {
                        await window.electronAPI.openFolder(
                            recordingConfig.filePath
                        )
                    }
                } catch (saveError) {
                    console.error("Save error:", saveError)
                    alert(`❌ Failed to save recording: ${saveError}`)
                }

                // Reset recording state
                setIsRecording(false)
                setRecordingTime(0)
                onSourceChange(null)
                onClose()
            }

            // Start recording
            mediaRecorder.start(2000)
            setIsRecording(true)
            setRecordingTime(0)

            console.log(`✅ Recording started for: ${source.name}`)
        } catch (error) {
            console.error("Error starting recording:", error)
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
        <div className="z-50 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-4 shadow-lg border border-white/20">
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

            {/* Record/Stop buttons */}
            {!isRecording ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        startRecording()
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2"
                    style={{ cursor: "pointer" }}
                >
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                    Start Recording
                </button>
            ) : (
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
            )}
        </div>
    )
}

export default FloatingBar
