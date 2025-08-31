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
import { MicIcon } from "~/icons/mic"
import { ScreenIcon } from "~/icons/screen"
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

    const toggleScreenSelection = () => {
        if (modal) {
            setModal(false)
            window.electronAPI.setWindowSize()
        } else {
            setModal(true)
            window.electronAPI.setWindowSize(420 + 280)
        }
    }

    return (
        <main className="grid h-screen grid-cols-[266px_400px] gap-4 overflow-hidden p-2">
            <section className="bg-background shadow-cursor flex flex-col overflow-x-hidden rounded-2xl">
                <header
                    style={{ WebkitAppRegion: "drag" }}
                    className="bg-background mb-2.5 flex w-full items-center justify-between gap-4 px-4 pt-2"
                >
                    <div
                        className="size-5 shrink-0"
                        style={{ backgroundImage: `url(${AppIcon})`, backgroundSize: "cover" }}
                    />

                    <button
                        className="relative -mr-2 grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                        onClick={() => window.electronAPI?.closeWindow()}
                    >
                        <CloseIcon strokeWidth={2} className="size-4" />
                    </button>
                </header>

                <aside className="bg-background grow px-4 pb-4">
                    <fieldset className="space-y-2">
                        <h3 className="mb-2 text-xs font-bold">Record Option</h3>

                        <Button
                            className="flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm whitespace-nowrap"
                            onPress={toggleScreenSelection}
                        >
                            <ScreenIcon className="text-primary size-4.5" />
                            <p className="w-0 grow truncate">{selectedSource?.name ?? "Screen"}</p>
                        </Button>
                    </fieldset>

                    <fieldset className="mt-4 space-y-2">
                        <h3 className="mb-2 text-xs font-bold">Record Settings</h3>
                        <Select
                            selectedKey={selectedCameraId ?? undefined}
                            onSelectionChange={(key) =>
                                setSelectedCameraId((key as string) ?? null)
                            }
                            placeholder="Camera"
                        >
                            <SelectTrigger>
                                <CameraIcon className="text-primary size-4.5" />
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem id="none">No Camera</SelectItem>
                                {cameras.map((c, idx) => (
                                    <SelectItem key={c.deviceId} id={c.deviceId}>
                                        {c.label || `Camera ${idx + 1}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            selectedKey={selectedMicId ?? undefined}
                            onSelectionChange={(key) => setSelectedMicId((key as string) ?? null)}
                            placeholder="Microphone"
                        >
                            <SelectTrigger>
                                <MicIcon className="text-primary size-4.5" />
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem id="none">No Microphone</SelectItem>
                                {mics.map((m, idx) => (
                                    <SelectItem key={m.deviceId} id={m.deviceId}>
                                        {m.label || `Microphone ${idx + 1}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            className="z-10 flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-1.5 text-left text-sm whitespace-nowrap disabled:opacity-60 [&>span]:w-0 [&>span]:grow [&>span]:truncate [&>svg]:size-4.5 [&>svg]:shrink-0"
                            onPress={() => setIsSystemSoundEnabled(!isSystemSoundEnabled)}
                        >
                            <VolumeIcon className="text-primary size-4.5" />
                            <p>System Sound</p>
                            <div
                                className={cn(
                                    "ml-auto grid w-10 place-items-center rounded-md py-0.5 font-semibold text-[#fff]",
                                    isSystemSoundEnabled ? "bg-green-600" : "bg-red-600",
                                )}
                            >
                                {isSystemSoundEnabled ? "On" : "Off"}
                            </div>
                        </Button>
                    </fieldset>
                    <Button className="bg-primary text-primary-foreground mt-4 w-full rounded-md px-3 py-2 text-sm">
                        Start Recording
                    </Button>
                </aside>
            </section>

            {modal ? (
                <Screens
                    displayMetrics={displayMetrics}
                    screenSources={screenSources}
                    selectedScreen={selectedSource}
                    onScreenSelected={selectSource}
                    onClose={toggleScreenSelection}
                />
            ) : null}
        </main>
    )
}

const root = createRoot(document.body)
root.render(<Recorder />)
