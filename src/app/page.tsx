import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"

// FloatingBar is now handled in separate window

import Header from "./-header"

const HomePage = () => {
    const [modal, setModal] = useState(false)
    const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
    const [selectedSource, setSelectedSource] = useState<ScreenSource>(null)

    useEffect(() => {
        // const loadScreenSources = () => {
        //     window.electronAPI
        //         .getScreenSources()
        //         .then((sources) => setScreenSources(sources))
        //         .catch((error) => console.error(error))
        // }

        // loadScreenSources()

        window.onfocus = () => {
            window.electronAPI
                .getScreenSources()
                .then((sources) => setScreenSources(sources))
                .catch((error) => console.error(error))
        }
    }, [])

    // Recording timer effect

    const getScreenSources = async () => {
        setModal(true)

        if (window.electronAPI) {
            try {
                const sources = await window.electronAPI.getScreenSources()
                setScreenSources(sources)
            } catch (error) {
                console.error("Failed to get screen sources:", error)
                alert(
                    "Failed to get screen sources. Make sure you are running in Electron."
                )
            }
        } else {
            alert(
                "This feature is only available in the Electron app, not in web preview."
            )
        }
    }

    const selectSource = async (source: ScreenSource) => {
        setSelectedSource(source)
        setModal(false)
        
        // Create floating window with selected source
        if (window.electronAPI?.createFloatingWindow) {
            try {
                await window.electronAPI.createFloatingWindow(source)
            } catch (error) {
                console.error("Failed to create floating window:", error)
                alert("Failed to create floating window")
            }
        }
    }

    return (
        <>
            {/* Main Window */}
            <div className="w-full h-screen bg-background shadow-lg flex flex-col border">
                <Header />

                <div className="p-4 mt-10 overflow-y-auto">
                    {modal ? (
                        <div className="flex gap-4 justify-center flex-wrap">
                            {screenSources.map((source) => (
                                <button
                                    key={source.id}
                                    className="w-80 overflow-hidden gap-4 justify-between border flex flex-col hover:bg-accent p-2 rounded-md"
                                    onClick={() => selectSource(source)}
                                >
                                    <img
                                        src={source.thumbnail}
                                        className="rounded-sm"
                                        alt={source.name}
                                    />
                                    <p className="truncate text-sm">
                                        {source.name}
                                    </p>
                                </button>
                            ))}
                            <button onClick={() => setModal(false)}>
                                Close
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center p-4 grow justify-center overflow-y-auto gap-4">
                            <button
                                onClick={() => getScreenSources()}
                                className="cursor-pointer size-24 rounded-full bg-primary grid place-items-center text-foreground-primary font-bold"
                            >
                                Record
                            </button>
                            {selectedSource && (
                                <div className="text-center mt-4">
                                    <p className="text-sm text-gray-600">
                                        Recording controls opened in floating window
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Selected: {selectedSource.name}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default HomePage
