import { tryCatchSync } from "~/utils/try-catch"

export type AudioMixerResult = {
    outputTrack?: MediaStreamTrack
    audioCtx: AudioContext | null
    audioDest: MediaStreamAudioDestinationNode | null
    dispose: () => void
}

function useAudioMixer() {
    const createAudioMixer = async (opts: {
        isSystemSoundEnabled: boolean
        primaryStream: MediaStream
        systemAudioStream: MediaStream | null
        micStream: MediaStream | null
    }): Promise<AudioMixerResult> => {
        const { isSystemSoundEnabled, primaryStream, systemAudioStream, micStream } = opts

        const hasPrimarySystemAudio =
            isSystemSoundEnabled && primaryStream.getAudioTracks().length > 0
        const hasLoopbackSystemAudio =
            isSystemSoundEnabled && (systemAudioStream?.getAudioTracks().length ?? 0) > 0
        const hasMicAudio = micStream?.getAudioTracks().length ? true : false

        if (!hasPrimarySystemAudio && !hasLoopbackSystemAudio && !hasMicAudio) {
            return {
                outputTrack: undefined,
                audioCtx: null,
                audioDest: null,
                dispose: () => {},
            }
        }

        let audioCtx: AudioContext | null = null
        let dest: MediaStreamAudioDestinationNode | null = null

        const { data, error } = tryCatchSync(() => {
            audioCtx = new AudioContext()
            dest = audioCtx.createMediaStreamDestination()

            if (hasPrimarySystemAudio) {
                const systemAudioOnly = new MediaStream(primaryStream.getAudioTracks())
                const sysSource = audioCtx.createMediaStreamSource(systemAudioOnly)
                sysSource.connect(dest)
            }

            if (hasLoopbackSystemAudio && systemAudioStream) {
                const loopbackOnly = new MediaStream(systemAudioStream.getAudioTracks())
                const loopSource = audioCtx.createMediaStreamSource(loopbackOnly)
                loopSource.connect(dest)
            }

            if (hasMicAudio && micStream) {
                const micAudioOnly = new MediaStream(micStream.getAudioTracks())
                const micSource = audioCtx.createMediaStreamSource(micAudioOnly)
                micSource.connect(dest)
            }

            const outputTrack = dest.stream.getAudioTracks()[0]

            const dispose = () => {
                tryCatchSync(() => {
                    dest?.stream.getTracks().forEach((t) => t.stop())
                    audioCtx?.close()
                })
            }

            return { outputTrack, audioCtx, audioDest: dest, dispose }
        })

        if (data) return data

        console.warn("Audio mixing failed; will fallback to available audio tracks:", error)
        // Fallback to picking a single available track
        const pickPreferredAudioTrack = (screen: MediaStream, mic: MediaStream | null) => {
            const screenAudio = screen.getAudioTracks()[0]
            if (screenAudio) return screenAudio
            const micAudio = mic?.getAudioTracks()?.[0]
            return micAudio
        }

        return {
            outputTrack: pickPreferredAudioTrack(primaryStream, micStream) || undefined,
            audioCtx: null,
            audioDest: null,
            dispose: () => {},
        }
    }

    return { createAudioMixer }
}

export default useAudioMixer
