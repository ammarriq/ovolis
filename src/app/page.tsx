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

        const sources = await window.electronAPI.getScreenSources()
        setScreenSources(sources)
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
                                onClick={() => {
                                    window.electronAPI
                                        .resizeWindow({
                                            appName: source.name,
                                            width: 800,
                                            height: 600,
                                        })
                                        .then(console.log)
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
                    <div className="flex items-center p-4 grow justify-center overflow-y-auto">
                        <button
                            onClick={() => getScreenSources()}
                            className="cursor-pointer size-24 rounded-full bg-primary grid place-items-center text-foreground-primary font-bold"
                        >
                            Record
                        </button>{" "}
                    </div>
                )}
            </div>
        </div>
    )
}

export default HomePage
