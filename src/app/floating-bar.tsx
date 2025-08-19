import "~/index.css"

import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import FloatingBar from "~/components/floating-bar"

const FloatingWindow = () => {
    const [source, setSource] = useState<ScreenSource | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Listen for source selection from main process
        const handleSourceSelected = (
            event: CustomEvent<{ source: ScreenSource }>
        ) => {
            const data = event.detail
            if (data?.source) {
                setSource(data.source)
                setIsVisible(true)
            }
        }

        // Add custom event listener for source selection
        window.addEventListener("source-selected", handleSourceSelected)

        return () => {
            window.removeEventListener("source-selected", handleSourceSelected)
        }
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        setSource(null)
        if (window.electronAPI?.closeFloatingBar) {
            window.electronAPI.closeFloatingBar()
        }
    }

    const handleSourceChange = (newSource: ScreenSource | null) => {
        setSource(newSource)
        if (!newSource) {
            handleClose()
        }
    }

    if (!source || !isVisible) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-transparent">
                <div className="text-white text-sm">
                    Waiting for source selection...
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-transparent">
            <FloatingBar
                source={source}
                isVisible={isVisible}
                onClose={handleClose}
                onSourceChange={handleSourceChange}
            />
        </div>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<FloatingWindow />)
