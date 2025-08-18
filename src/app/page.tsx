import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"

import Header from "./-header"

const HomePage = () => {
    const [modal, setModal] = useState(false)
    const [screenSources, setScreenSources] = useState<ScreenSource[]>([])

    useEffect(() => {
        window.electronAPI.getScreenSources().then((sources) => {
            setScreenSources(sources)
        })

        window.onfocus = () => {
            window.electronAPI.getScreenSources().then((sources) => {
                setScreenSources(sources)
            })
        }
    }, [])

    const getScreenSources = async () => {
        setModal(true)

        if (window.electronAPI) {
            const sources = await window.electronAPI.getScreenSources()
            setScreenSources(sources)
        } else {
            console.warn("electronAPI not available")
        }
    }

    return (
        <div className="w-full h-screen bg-background shadow-lg flex flex-col border">
            <Header />

            <div className="p-4 mt-10 overflow-y-auto">
                {modal ? (
                    <div className="flex gap-4 justify-center flex-wrap">
                        {screenSources.map((source) => (
                            <button
                                key={source.id}
                                className="w-80 overflow-hidden gap-4 justify-between border flex flex-col hover:bg-accent p-2 rounded-md"
                                onClick={async () => {
                                    try {
                                        // Bring the window forward first
                                        const bringForwardResult =
                                            await window.electronAPI.focusWindow(
                                                source.name
                                            )
                                        console.log(
                                            "Bring forward result:",
                                            bringForwardResult
                                        )

                                        // Start high-resolution recording
                                    } catch (error) {
                                        console.error("Error:", error)
                                        alert(
                                            `❌ Failed to start recording: ${error instanceof Error ? error.message : String(error)}`
                                        )
                                    }
                                }}
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
                        <button onClick={() => setModal(false)}>Close</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center p-4 grow justify-center overflow-y-auto gap-4">
                        <button
                            onClick={() => getScreenSources()}
                            className="cursor-pointer size-24 rounded-full bg-primary grid place-items-center text-foreground-primary font-bold"
                        >
                            Record
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HomePage
