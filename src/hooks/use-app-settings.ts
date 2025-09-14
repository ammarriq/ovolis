import type { AppSettings } from "~/types/app-settings"

import { useEffect, useState } from "react"

import { tryCatch } from "~/utils/try-catch"

function useAppSettings() {
    const [isAppRecording, setIsAppRecording] = useState(false)
    const [saveLocation, setSaveLocation] = useState<string | null>(null)

    const getDirName = (p: string) => {
        if (!p) return ""
        const norm = p.replace(/\\/g, "/")
        const parts = norm.split("/")
        return parts[parts.length - 1] || p
    }

    // Load persistent settings on component mount
    useEffect(() => {
        const loadPersistedSettings = async () => {
            const { data, error } = await tryCatch(window.electronAPI.loadAppSettings())
            if (error || !data) {
                console.error("Failed to load app settings:", error)
                return
            }

            setIsAppRecording(data.shouldRecordApp)
            if (data.saveLocation) {
                setSaveLocation(data.saveLocation)
            }
        }

        loadPersistedSettings()
    }, [setSaveLocation])

    const handleSaveLocation = async () => {
        const dir = await window.electronAPI.chooseSaveLocation()
        if (!dir) return

        const { error } = await tryCatch(window.electronAPI.setAppSetting("saveLocation", dir))
        if (error) {
            console.error("Failed to save saveLocation setting:", error)
        }

        setSaveLocation(dir)
    }

    const handleIsAppRecording = async (isRecording: AppSettings["shouldRecordApp"]) => {
        const { error } = await tryCatch(
            window.electronAPI.setAppSetting("shouldRecordApp", isRecording),
        )
        if (error) {
            console.error("Failed to save shouldRecordApp setting:", error)
        }

        setIsAppRecording(isRecording)
    }

    return {
        isAppRecording,
        saveLocation: saveLocation ? getDirName(saveLocation) : "",
        handleSaveLocation,
        handleIsAppRecording,
    }
}

export default useAppSettings
