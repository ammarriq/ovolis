import { useState } from "react"

interface FloatingBarProps {
    onStop: () => void
    isRecording: boolean
    recordingTime: number
}

const FloatingBar = ({ onStop, isRecording, recordingTime }: FloatingBarProps) => {
    const [isDragging, setIsDragging] = useState(false)
    const [position, setPosition] = useState({ x: 50, y: 50 })

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        const startX = e.clientX - position.x
        const startY = e.clientY - position.y

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - startX,
                y: e.clientY - startY
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    if (!isRecording) return null

    return (
        <div
            className={`fixed z-50 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-4 shadow-lg border border-white/20 ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Recording indicator */}
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white font-mono text-sm">
                    {formatTime(recordingTime)}
                </span>
            </div>

            {/* Stop button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onStop()
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer"
                style={{ cursor: 'pointer' }}
            >
                Stop Recording
            </button>
        </div>
    )
}

export default FloatingBar