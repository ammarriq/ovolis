import { tryCatch } from "~/utils/try-catch";
function useAudioSources() {
    const createAudioSources = async (opts) => {
        const { isSystemSoundEnabled, selectedMicId, primaryStream } = opts;
        let systemAudioStream = null;
        if (isSystemSoundEnabled && primaryStream.getAudioTracks().length <= 0) {
            const constraints = {
                video: false,
                audio: { mandatory: { chromeMediaSource: "desktop" } },
            };
            const { data, error } = await tryCatch(navigator.mediaDevices.getUserMedia(constraints));
            if (error)
                console.warn("System loopback audio not available:", error);
            if (data)
                systemAudioStream = data;
        }
        let micStream = null;
        if (selectedMicId) {
            const constraints = {
                audio: {
                    deviceId: { exact: selectedMicId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false,
            };
            const { data, error } = await tryCatch(navigator.mediaDevices.getUserMedia(constraints));
            if (error)
                console.warn("Microphone capture failed; continuing without mic:", error);
            if (data)
                micStream = data;
        }
        return { systemAudioStream, micStream };
    };
    return { createAudioSources };
}
export default useAudioSources;
//# sourceMappingURL=use-audio-sources.js.map