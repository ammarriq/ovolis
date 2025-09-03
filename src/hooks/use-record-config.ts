import type { RecordConfig } from "~/types/record-config"

import { useEffect, useState } from "react"

function useRecordConfig() {
    const [config, setConfig] = useState<RecordConfig | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const handler = (event: CustomEvent<{ config: RecordConfig }>) => {
            setConfig(event.detail.config)
            setIsLoading(false)
        }
        window.addEventListener("record-config", handler as EventListener)
        return () => {
            window.removeEventListener("record-config", handler as EventListener)
        }
    }, [])

    return { config, isLoading }
}

export default useRecordConfig

