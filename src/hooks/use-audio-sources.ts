import { tryCatch } from "~/utils/try-catch"

function useAudioSources() {
    const createAudioSources = async (opts: {
        isSystemSoundEnabled: boolean
        selectedMicId: string | null
        primaryStream: MediaStream
    }) => {
        const { isSystemSoundEnabled, selectedMicId, primaryStream } = opts

        let systemAudioStream: MediaStream | null = null
        if (isSystemSoundEnabled && primaryStream.getAudioTracks().length <= 0) {
            const constraints = {
                video: false,
                audio: { mandatory: { chromeMediaSource: "desktop" } } as MediaTrackConstraints,
            }

            const { data, error } = await tryCatch(navigator.mediaDevices.getUserMedia(constraints))
            if (error) console.warn("System loopback audio not available:", error)
            if (data) systemAudioStream = data
        }

        let micStream: MediaStream | null = null
        if (selectedMicId) {
            const constraints = {
                audio: {
                    deviceId: { exact: selectedMicId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            }

            const { data, error } = await tryCatch(navigator.mediaDevices.getUserMedia(constraints))
            if (error) console.warn("Microphone capture failed; continuing without mic:", error)
            if (data) micStream = data
        }

        return { systemAudioStream, micStream }
    }

    return { createAudioSources }
}

export default useAudioSources
