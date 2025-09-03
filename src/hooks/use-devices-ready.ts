import { useEffect, useState } from "react"

function useDevicesReady() {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        let cancelled = false

        navigator.mediaDevices
            .enumerateDevices()
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setReady(true)
            })

        return () => {
            cancelled = true
        }
    }, [])

    return ready
}

export default useDevicesReady
