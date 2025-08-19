import { createRoot } from "react-dom/client"
import { useEffect, useState } from "react"
import type { ScreenSource } from "~/types/screen-sources"
import FloatingBar from "~/components/floating-bar"
import "~/index.css"

const FloatingWindow = () => {
    const [source, setSource] = useState<ScreenSource | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Listen for source selection from main process
        const handleSourceSelected = (event: any) => {
            const data = event.detail
            if (data?.source) {
                setSource(data.source)
                setIsVisible(true)
            }
        }

        // Add custom event listener for source selection
        window.addEventListener('source-selected', handleSourceSelected)

        // Request initial data from main process
        if (window.electronAPI?.getFloatingWindowData) {
            window.electronAPI.getFloatingWindowData().then((data: any) => {
                if (data?.source) {
                    setSource(data.source)
                    setIsVisible(true)
                }
            })
        }

        return () => {
            window.removeEventListener('source-selected', handleSourceSelected)
        }
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        setSource(null)
        if (window.electronAPI?.closeFloatingWindow) {
            window.electronAPI.closeFloatingWindow()
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
                <div className="text-white text-sm">Waiting for source selection...</div>
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

const root = createRoot(document.getElementById('root')!)
root.render(<FloatingWindow />)