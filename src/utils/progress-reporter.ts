import type { ConversionProgress, ConversionState } from "../types/ffmpeg.js"

export class ProgressReporter {
    private listeners: Set<(state: ConversionState) => void> = new Set()
    private currentState: ConversionState = { status: "idle" }
    private startTime?: number
    private lastProgress?: ConversionProgress

    public addListener(callback: (state: ConversionState) => void): void {
        this.listeners.add(callback)
        // Immediately send current state to new listener
        callback(this.currentState)
    }

    public removeListener(callback: (state: ConversionState) => void): void {
        this.listeners.delete(callback)
    }

    public removeAllListeners(): void {
        this.listeners.clear()
    }

    public updateProgress(progress: ConversionProgress): void {
        this.lastProgress = progress

        // Calculate estimated time remaining
        let estimatedTimeRemaining: number | undefined
        if (this.startTime && progress.percentage > 0) {
            const elapsed = Date.now() - this.startTime
            const totalEstimated = (elapsed / progress.percentage) * 100
            estimatedTimeRemaining = Math.max(0, totalEstimated - elapsed)
        }

        this.currentState = {
            status: "converting",
            progress,
            startTime: this.startTime,
            estimatedTimeRemaining,
        }

        this.notifyListeners()
    }

    public startConversion(): void {
        this.startTime = Date.now()
        this.currentState = {
            status: "converting",
            startTime: this.startTime,
        }
        this.notifyListeners()
    }

    public completeConversion(outputPath: string): void {
        this.currentState = {
            status: "completed",
            outputPath,
            startTime: this.startTime,
            progress: this.lastProgress,
        }
        this.notifyListeners()
    }

    public errorConversion(error: string): void {
        this.currentState = {
            status: "error",
            error,
            startTime: this.startTime,
            progress: this.lastProgress,
        }
        this.notifyListeners()
    }

    public cancelConversion(): void {
        this.currentState = {
            status: "cancelled",
            startTime: this.startTime,
            progress: this.lastProgress,
        }
        this.notifyListeners()
    }

    public resetState(): void {
        this.currentState = { status: "idle" }
        this.startTime = undefined
        this.lastProgress = undefined
        this.notifyListeners()
    }

    public getCurrentState(): ConversionState {
        return { ...this.currentState }
    }

    private notifyListeners(): void {
        const state = { ...this.currentState }
        this.listeners.forEach((callback) => {
            try {
                callback(state)
            } catch (error) {
                console.error("Error in progress reporter listener:", error)
            }
        })
    }

    public getFormattedProgress(): string {
        if (!this.lastProgress) return "Starting..."

        const { frame, fps, speed, percentage } = this.lastProgress

        if (percentage !== undefined && percentage > 0) {
            return `${percentage.toFixed(1)}% complete`
        }

        if (frame !== undefined) {
            let status = `Frame ${frame}`
            if (fps !== undefined && fps > 0) {
                status += ` (${fps.toFixed(1)} fps)`
            }
            if (speed !== undefined && speed > 0) {
                status += ` at ${speed.toFixed(2)}x speed`
            }
            return status
        }

        return "Processing..."
    }

    public getFormattedTimeRemaining(): string {
        if (!this.currentState.estimatedTimeRemaining) return ""

        const seconds = Math.ceil(
            this.currentState.estimatedTimeRemaining / 1000
        )

        if (seconds < 60) {
            return `~${seconds}s remaining`
        }

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60

        if (minutes < 60) {
            return `~${minutes}m ${remainingSeconds}s remaining`
        }

        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `~${hours}h ${remainingMinutes}m remaining`
    }

    public getElapsedTime(): string {
        if (!this.startTime) return ""

        const elapsed = Date.now() - this.startTime
        const seconds = Math.floor(elapsed / 1000)

        if (seconds < 60) {
            return `${seconds}s`
        }

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60

        if (minutes < 60) {
            return `${minutes}m ${remainingSeconds}s`
        }

        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `${hours}h ${remainingMinutes}m`
    }
}

// Export singleton instance
export const progressReporter = new ProgressReporter()
