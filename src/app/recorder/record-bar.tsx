import "@fontsource-variable/noto-sans-lao"
import "~/index.css"

import type { ScreenSource } from "~/types/screen-sources"

import { createRoot } from "react-dom/client"

import FloatingBar from "~/components/floating-bar"
import useScreenSource from "~/hooks/use-screen-source"

const RecordBar = () => {
    const { source, isLoading } = useScreenSource()

    const handleClose = () => {
        // setIsVisible(false)
        // setSource(null)
        if (window.electronAPI?.closeRecordBar) {
            window.electronAPI.closeRecordBar()
        }
    }

    const handleSourceChange = (_newSource: ScreenSource | null) => {
        // setSource(newSource)
        // if (!newSource) {
        //     handleClose()
        // }
    }

    console.log(source)
    if (!source || isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-transparent">
                <div className="text-sm text-white">Waiting for source selection...</div>
            </div>
        )
    }

    return (
        <div className="flex h-full w-full items-center justify-center bg-transparent">
            <FloatingBar
                source={source}
                isVisible={!isLoading}
                onClose={handleClose}
                onSourceChange={handleSourceChange}
            />
        </div>
    )
}

const root = createRoot(document.getElementById("root")!)
root.render(<RecordBar />)
