import { useEffect, useRef, useState } from "react"

interface Props {
    onMicChange: (deviceId: string | null) => void
    onCameraChange: (deviceId: string | null) => void
}

function useDevices({ onMicChange, onCameraChange }: Props) {
    const [mics, setMics] = useState<MediaDeviceInfo[]>([])
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])

    const micIdRef = useRef<string | null>(null)
    const camIdRef = useRef<string | null>(null)

    useEffect(() => {
        const pickPreferredPerGroup = (list: MediaDeviceInfo[]) => {
            const groups = new Map<string, MediaDeviceInfo[]>()
            for (const d of list) {
                const key = d.groupId || d.deviceId
                const arr = groups.get(key) ?? []
                arr.push(d)
                groups.set(key, arr)
            }

            const result: MediaDeviceInfo[] = []
            for (const arr of groups.values()) {
                const preferred =
                    arr.find((d) => d.deviceId !== "default" && d.deviceId !== "communications") ??
                    arr[0]
                result.push(preferred)
            }
            return result
        }

        const refreshDevices = async () => {
            try {
                const all = await navigator.mediaDevices.enumerateDevices()
                const audioInputs = all.filter((d) => d.kind === "audioinput")
                const videoInputs = all.filter((d) => d.kind === "videoinput")

                const uniqueMics = pickPreferredPerGroup(audioInputs)
                const uniqueCameras = pickPreferredPerGroup(videoInputs)

                setMics(uniqueMics)
                setCameras(uniqueCameras)

                const prevMicId = micIdRef.current
                if (prevMicId && uniqueMics.some((d) => d.deviceId === prevMicId)) {
                    onMicChange?.(prevMicId)
                } else {
                    onMicChange?.(null)
                }

                const prevCamId = camIdRef.current
                if (prevCamId && uniqueCameras.some((d) => d.deviceId === prevCamId)) {
                    onCameraChange?.(prevCamId)
                } else {
                    onCameraChange?.(null)
                }
            } catch (error) {
                console.error(error)
            }
        }

        refreshDevices()
        navigator.mediaDevices.addEventListener("devicechange", refreshDevices)
        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", refreshDevices)
        }
    }, [onCameraChange, onMicChange])

    return { mics, cameras }
}

export default useDevices
