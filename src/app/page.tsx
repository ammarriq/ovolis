import type { ScreenSource } from "~/types/screen-sources"

import { useState } from "react"

import Header from "./-header"

const HomePage = () => {
    const [modal, setModal] = useState(false)
    const [screenSources, setScreenSources] = useState<ScreenSource[]>([])

    const getScreenSources = async () => {
        setModal(true)

        const sources = await window.electronAPI?.getScreenSources()
        setScreenSources(sources)
    }

    return (
        <div className="w-full h-screen bg-background shadow-lg flex flex-col border">
            <Header />

            <div className="flex items-center p-4 grow justify-center">
                {modal ? (
                    <div>
                        {screenSources.map((source) => (
                            <div key={source.id}>
                                <p>{source.name}</p>
                            </div>
                        ))}
                        <button onClick={() => setModal(false)}>Close</button>
                    </div>
                ) : (
                    <button
                        onClick={() => getScreenSources()}
                        className="cursor-pointer size-24 rounded-full bg-primary grid place-items-center text-foreground-primary font-bold"
                    >
                        Record
                    </button>
                )}
            </div>
        </div>
    )
}

export default HomePage
