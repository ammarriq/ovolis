import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"

interface Props {
    selectedSource: ScreenSource
}

function useDisplayMetrics({ selectedSource }: Props) {
    const [displayMetrics, setDisplayMetrics] = useState<{
        width: number
        height: number
    }>(null)

    useEffect(() => {
        const getDisplayMetrics = async () => {
            if (!selectedSource) return

            try {
                const metrics = await window.electronAPI.getDisplayMetrics(selectedSource.displayId)
                setDisplayMetrics({ width: metrics.width, height: metrics.height })
            } catch (error) {
                console.error(error)
                setDisplayMetrics(null)
            }
        }

        getDisplayMetrics()
    }, [selectedSource])

    return displayMetrics
}

export default useDisplayMetrics
