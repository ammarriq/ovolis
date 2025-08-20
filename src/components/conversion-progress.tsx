import { useEffect, useState } from "react"

import type { ConversionState, ConversionProgress } from "~/types/ffmpeg"

interface ConversionProgressProps {
    isVisible: boolean
    onCancel?: () => void
}

const ConversionProgress = ({
    isVisible,
    onCancel,
}: ConversionProgressProps) => {
    const [conversionState, setConversionState] = useState<ConversionState>({
        status: "idle",
    })

    useEffect(() => {
        if (!window.electronAPI || !isVisible) return

        // Listen for FFmpeg progress updates
        const handleProgress = (progress: ConversionProgress) => {
            setConversionState((prevState) => ({
                ...prevState,
                status: "converting",
                progress,
            }))
        }

        window.electronAPI.onFFmpegProgress(handleProgress)

        return () => {
            window.electronAPI.removeFFmpegProgressListener()
        }
    }, [isVisible])

    const handleCancel = () => {
        if (window.electronAPI && conversionState.status === "converting") {
            window.electronAPI.ffmpegCancelConversion()
            setConversionState((prevState) => ({
                ...prevState,
                status: "cancelled",
            }))
        }
        if (onCancel) {
            onCancel()
        }
    }

    const getProgressPercentage = (): number => {
        if (!conversionState.progress) return 0
        return Math.min(
            100,
            Math.max(0, conversionState.progress.percentage || 0)
        )
    }

    const getProgressText = (): string => {
        const { status, progress } = conversionState

        switch (status) {
            case "idle":
                return "Ready to convert"
            case "converting":
                if (progress) {
                    const percentage = getProgressPercentage()
                    if (percentage > 0) {
                        return `Converting... ${percentage.toFixed(1)}%`
                    }
                    if (progress.frame !== undefined) {
                        let text = `Processing frame ${progress.frame}`
                        if (progress.fps !== undefined && progress.fps > 0) {
                            text += ` (${progress.fps.toFixed(1)} fps)`
                        }
                        if (
                            progress.speed !== undefined &&
                            progress.speed > 0
                        ) {
                            text += ` at ${progress.speed.toFixed(2)}x speed`
                        }
                        return text
                    }
                }
                return "Converting..."
            case "completed":
                return "Conversion completed!"
            case "error":
                return `Error: ${conversionState.error || "Unknown error"}`
            case "cancelled":
                return "Conversion cancelled"
            default:
                return "Processing..."
        }
    }

    const getStatusColor = (): string => {
        switch (conversionState.status) {
            case "converting":
                return "text-blue-400"
            case "completed":
                return "text-green-400"
            case "error":
                return "text-red-400"
            case "cancelled":
                return "text-yellow-400"
            default:
                return "text-gray-400"
        }
    }

    const getElapsedTime = (): string => {
        if (!conversionState.startTime) return ""

        const elapsed = Date.now() - conversionState.startTime
        const seconds = Math.floor(elapsed / 1000)

        if (seconds < 60) {
            return `${seconds}s`
        }

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}m ${remainingSeconds}s`
    }

    const getEstimatedTimeRemaining = (): string => {
        if (!conversionState.estimatedTimeRemaining) return ""

        const seconds = Math.ceil(conversionState.estimatedTimeRemaining / 1000)

        if (seconds < 60) {
            return `~${seconds}s remaining`
        }

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `~${minutes}m ${remainingSeconds}s remaining`
    }

    if (!isVisible) return null

    const progressPercentage = getProgressPercentage()
    const showProgressBar =
        conversionState.status === "converting" && progressPercentage > 0
    const showCancelButton = conversionState.status === "converting"

    return (
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-lg min-w-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium text-sm">
                    Converting to MP4
                </h3>
                {showCancelButton && (
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            {showProgressBar && (
                <div className="mb-3">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Status Text */}
            <div className={`text-sm ${getStatusColor()} mb-2`}>
                {getProgressText()}
            </div>

            {/* Time Information */}
            <div className="flex justify-between text-xs text-gray-400">
                <span>
                    {conversionState.startTime
                        ? `Elapsed: ${getElapsedTime()}`
                        : ""}
                </span>
                <span>{getEstimatedTimeRemaining()}</span>
            </div>

            {/* Additional Progress Details */}
            {conversionState.progress &&
                conversionState.status === "converting" && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                            {conversionState.progress.bitrate && (
                                <div>
                                    Bitrate: {conversionState.progress.bitrate}
                                </div>
                            )}
                            {conversionState.progress.totalSize && (
                                <div>
                                    Size: {conversionState.progress.totalSize}
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </div>
    )
}

export default ConversionProgress
