import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import Header from "./-header"
import { DragIcon } from "~/icons/drag"
import { CloseIcon } from "~/icons/close"

const Recorder = () => {
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

        try {
            await window.electronAPI.createFloatingBar({ ...source })
        } catch (error) {
            console.error("Failed to create floating window:", error)
            alert("Failed to create floating window")
        }
    }

    const getMediaDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            console.log(devices)
        } catch (error) {
            console.error("Failed to enumerate media devices:", error)
        }
    }

    return (
        <div className="w-full h-screen flex flex-col p-2">
            <div className="overflow-y-auto w-80 h-100 bg-background rounded-2xl shadow-[0px_0px_8px_-3px_rgba(0,0,0,0.35)]">
                <header
                    className="flex items-center justify-between p-4"
                    style={{ WebkitAppRegion: "drag" }}
                >
                    <button className="cursor-move">
                        <DragIcon />
                    </button>
                    <button
                        style={{ WebkitAppRegion: "no-drag" }}
                        onClick={() => window.electronAPI?.closeWindow()}
                    >
                        <CloseIcon />
                    </button>
                </header>

                {/* {modal ? (
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
                )} */}
            </div>

            <div className="rounded-2xl w-80 p-4 mt-4 bg-background shadow-[0px_0px_8px_-3px_rgba(0,0,0,0.35)]">
                <p>Recording in progress...</p>
            </div>
        </div>
    )
}

const root = createRoot(document.body)
root.render(<Recorder />)
