import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"

function useSelectedScreen() {
    const [source, setSource] = useState<ScreenSource | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const handleSourceSelected = (event: CustomEvent<{ source: ScreenSource }>) => {
            const data = event.detail

            setSource(data.source)
            setIsLoading(false)
        }

        window.addEventListener("source-selected", handleSourceSelected)

        return () => {
            window.removeEventListener("source-selected", handleSourceSelected)
        }
    }, [])

    return { source, isLoading }
}

export default useSelectedScreen
