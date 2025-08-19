import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState, useRef } from "react"

import Header from "./-header"
import FloatingBar from "~/components/floating-bar"

const HomePage = () => {
    const [modal, setModal] = useState(false)
    const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [showMainWindow, setShowMainWindow] = useState(true)
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Check if electronAPI is available (not available in web preview)
        if (typeof window !== "undefined" && window.electronAPI) {
            window.electronAPI
                .getScreenSources()
                .then((sources) => {
                    setScreenSources(sources)
                })
                .catch((error) => {
                    console.error("Failed to get screen sources:", error)
                })

            window.onfocus = () => {
                if (window.electronAPI) {
                    window.electronAPI
                        .getScreenSources()
                        .then((sources) => {
                            setScreenSources(sources)
                        })
                        .catch((error) => {
                            console.error(
                                "Failed to get screen sources on focus:",
                                error
                            )
                        })
                }
            }
        } else {
            console.log(
                "ElectronAPI not available - running in web preview mode"
            )
        }
    }, [])

    // Recording timer effect
    useEffect(() => {
        if (isRecording) {
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
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

    const getScreenSources = async () => {
        setModal(true)

        if (window.electronAPI) {
            try {
                const sources = await window.electronAPI.getScreenSources()
                setScreenSources(sources)
            } catch (error) {
                console.error("Failed to get screen sources:", error)
                alert(
                    "Failed to get screen sources. Make sure you are running in Electron."
                )
            }
        } else {
            alert(
                "This feature is only available in the Electron app, not in web preview."
            )
        }
    }

    const record = async (source: ScreenSource) => {
        if (!window.electronAPI) {
            alert(
                "Recording is only available in the Electron app, not in web preview."
            )
            return
        }

        window.electronAPI.resizeWindow({
            appName: source.name,
            width: 1920,
            height: 1080,
        })

        try {
            // Bring the window forward first
            const bringForwardResult = await window.electronAPI.focusWindow(
                source.name
            )
            console.log("Bring forward result:", bringForwardResult)

            // Get recording configuration
            const recordingConfigStr =
                await window.electronAPI.startHighResRecording(
                    source.id,
                    source.name
                )
            const recordingConfig = JSON.parse(recordingConfigStr)
            console.log("Recording config:", recordingConfig)

            // Start actual recording using MediaRecorder with high quality settings
            const stream = await navigator.mediaDevices.getUserMedia(
                recordingConfig.constraints
            )
            streamRef.current = stream

            // Try different codecs for best quality, fallback if not supported
            const mimeType = "video/mp4; codecs=avc1.640028, mp4a.40.2"

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 4000000, // 4 Mbps - more conservative for stability
                audioBitsPerSecond: 128000, // 128 kbps for audio
            })
            mediaRecorderRef.current = mediaRecorder

            const chunks: Blob[] = []
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "video/mp4" })
                const arrayBuffer = await blob.arrayBuffer()
                const uint8Array = new Uint8Array(arrayBuffer)

                try {
                    const saveResult =
                        await window.electronAPI.saveRecordingData(
                            recordingConfig.filePath,
                            uint8Array
                        )
                    console.log("Save result:", saveResult)
                    alert(`✅ Recording saved: ${saveResult}`)
                } catch (saveError) {
                    console.error("Save error:", saveError)
                    alert(`❌ Failed to save recording: ${saveError}`)
                }
                
                // Reset recording state
                setIsRecording(false)
                setShowMainWindow(true)
                setModal(false)
            }

            // Start recording with high quality data collection
            mediaRecorder.start(500) // Collect data every 500ms for stability
            
            // Set recording state and hide main window
            setIsRecording(true)
            setShowMainWindow(false)
            setModal(false)

            console.log(`✅ Recording started for: ${source.name}`)
        } catch (error) {
            console.error("Error:", error)
            alert(
                `❌ Failed to start recording: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        
        // Reset state will be handled in mediaRecorder.onstop
    }

    return (
        <>
            {/* Main Window - only show when not recording */}
            {showMainWindow && (
                <div className="w-full h-screen bg-background shadow-lg flex flex-col border">
                    <Header />

                    <div className="p-4 mt-10 overflow-y-auto">
                        {modal ? (
                            <div className="flex gap-4 justify-center flex-wrap">
                                {screenSources.map((source) => (
                                    <button
                                        key={source.id}
                                        className="w-80 overflow-hidden gap-4 justify-between border flex flex-col hover:bg-accent p-2 rounded-md"
                                        onClick={() => record(source)}
                                    >
                                        <img
                                            src={source.thumbnail}
                                            className="rounded-sm"
                                            alt={source.name}
                                        />
                                        <p className="truncate text-sm">
                                            {source.name}
                                        </p>
                                    </button>
                                ))}
                                <button onClick={() => setModal(false)}>Close</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center p-4 grow justify-center overflow-y-auto gap-4">
                                <button
                                    onClick={() => getScreenSources()}
                                    className="cursor-pointer size-24 rounded-full bg-primary grid place-items-center text-foreground-primary font-bold"
                                >
                                    Record
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Floating Bar - only show when recording */}
            <FloatingBar 
                onStop={stopRecording}
                isRecording={isRecording}
                recordingTime={recordingTime}
            />
        </>
    )
}

export default HomePage
