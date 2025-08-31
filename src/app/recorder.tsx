import type { ScreenSource } from "~/types/screen-sources"

import { useState } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "react-aria-components"

import Screens from "~/components/screens"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import useDevices from "~/hooks/use-devices"
import useDisplayMetrics from "~/hooks/use-display-metrics"
import useScreenSources from "~/hooks/use-screen-sources"
import { CameraIcon } from "~/icons/camera"
import { CloseIcon } from "~/icons/close"
import { DeleteIcon } from "~/icons/delete"
import { MicIcon } from "~/icons/mic"
import { PauseIcon } from "~/icons/pause"
import { ScreenIcon } from "~/icons/screen"
import { StopIcon } from "~/icons/stop"
import { VolumeIcon } from "~/icons/volume"
import { cn } from "~/utils/cn"

import AppIcon from "../assets/icons/icon.png"

const Recorder = () => {
    const [modal, setModal] = useState(false)
    const [selectedSource, setSelectedSource] = useState<ScreenSource>()

    const [selectedMicId, setSelectedMicId] = useState<string | null>(null)
    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
    const [isSystemSoundEnabled, setIsSystemSoundEnabled] = useState(false)

    const screenSources = useScreenSources()
    const displayMetrics = useDisplayMetrics({
        selectedSource,
    })

    const { mics, cameras } = useDevices({
        onMicChange: setSelectedMicId,
        onCameraChange: setSelectedCameraId,
    })

    // Recording timer effect

    const selectSource = async (source: ScreenSource) => {
        setSelectedSource(source)
        // setModal(false)

        // try {
        //     await window.electronAPI.createFloatingBar({ ...source })
        // } catch (error) {
        //     console.error("Failed to create floating window:", error)
        //     alert("Failed to create floating window")
        // }
    }

    return (
        <main className="grid h-max gap-4 overflow-hidden p-2">
            <section
                className="bg-background shadow-cursor flex w-max items-center overflow-x-hidden rounded-2xl py-3 pr-4 pl-3"
                style={{ WebkitAppRegion: "drag" }}
            >
                <div className="flex items-center gap-4">
                    <div className="grid w-10 shrink-0 place-items-center gap-2 rounded-md bg-[#F3F4F6] py-0.5 text-left text-[13px] font-semibold whitespace-nowrap text-red-600">
                        9:00
                    </div>
                    <Button>
                        <StopIcon className="size-5 text-red-600" />
                    </Button>

                    <Button>
                        <PauseIcon className="size-5" />
                    </Button>
                </div>

                <div className="mx-4 h-3/4 border-r"></div>

                <Button>
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

const root = createRoot(document.body)
root.render(<Recorder />)
