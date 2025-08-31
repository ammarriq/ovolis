import { useState } from "react"
import { Button } from "react-aria-components"

import { DeleteIcon } from "~/icons/delete"
import { PauseIcon } from "~/icons/pause"
import { PlayIcon } from "~/icons/play"
import { StopIcon } from "~/icons/stop"

interface Props {
    onStop: () => void
}

function RecordBar({ onStop }: Props) {
    const [isPaused, setIsPaused] = useState(false)

    return (
        <main className="grid size-max gap-4 overflow-hidden p-2">
            <section
                className="bg-background shadow-cursor flex items-center overflow-x-hidden rounded-2xl py-3 pr-4 pl-3"
                style={{ WebkitAppRegion: "drag" }}
            >
                <div className="grid shrink-0 place-items-center gap-2 rounded-md py-0.5 text-left text-sm font-medium whitespace-nowrap text-red-600">
                    00:01
                </div>

                <div className="mx-4 h-3/4 border-r"></div>

                <div className="flex items-center gap-4">
                    <Button style={{ WebkitAppRegion: "no-drag" }} onPress={onStop}>
                        <StopIcon className="size-5 text-red-600" />
                    </Button>

                    {isPaused ? (
                        <Button
                            onClick={() => setIsPaused(false)}
                            style={{ WebkitAppRegion: "no-drag" }}
                        >
                            <PauseIcon className="size-5" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setIsPaused(true)}
                            style={{ WebkitAppRegion: "no-drag" }}
                        >
                            <PlayIcon className="size-5" />
                        </Button>
                    )}
                </div>

                <div className="mx-4 h-3/4 border-r"></div>

                <Button style={{ WebkitAppRegion: "no-drag" }}>
                    <DeleteIcon className="size-5" />
                </Button>
                {/* 
                <div className="mx-4 h-3/4 border-r"></div>

                <button
                    className="relative grid shrink-0 place-items-center rounded-full"
                    style={{ WebkitAppRegion: "no-drag" }}
                    onClick={() => window.electronAPI?.closeWindow()}
                >
                    <CloseIcon strokeWidth={2} className="size-4" />
                </button> */}
            </section>
        </main>
    )
}

export default RecordBar
