import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"
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
import { CameraIcon } from "~/icons/camera"
import { CloseIcon } from "~/icons/close"
import { MicIcon } from "~/icons/mic"
import { ScreenIcon } from "~/icons/screen"
import { VolumeIcon } from "~/icons/volume"

import AppIcon from "../assets/icons/icon.png"

const Recorder = () => {
    const [modal, setModal] = useState(false)
    const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
    const [selectedSource, setSelectedSource] = useState<ScreenSource>()

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

    const [displayMetrics, setDisplayMetrics] = useState<{
        width: number
        height: number
    } | null>(null)

    // Layout handled purely via CSS grid (no absolute positioning)

    useEffect(() => {
        const loadScreenSources = () => {
            window.electronAPI
                .getScreenSources()
                .then((sources) => setScreenSources(sources))
                .catch((error) => console.error(error))
        }

        loadScreenSources()

        window.onfocus = () => {
            window.electronAPI
                .getScreenSources()
                .then((sources) => setScreenSources(sources))
                .catch((error) => console.error(error))
        }
    }, [])

    // Load display metrics for the selected source (fit presets to monitor)
    useEffect(() => {
        if (!selectedSource) return
        window.electronAPI
            ?.getDisplayMetrics(selectedSource.displayId)
            .then((m) => setDisplayMetrics({ width: m.width, height: m.height }))
            .catch(() => setDisplayMetrics(null))
    }, [selectedSource])

    useEffect(() => {
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                const groupedDevices = Object.groupBy(devices, (d) => d.kind)
                console.log(groupedDevices)
            })
            .catch((error) => console.error(error))
    }, [])

    // Recording timer effect

    const _getScreenSources = async () => {
        setModal(true)

        if (window.electronAPI) {
            try {
                const sources = await window.electronAPI.getScreenSources()
                setScreenSources(sources)
            } catch (error) {
                console.error("Failed to get screen sources:", error)
                alert("Failed to get screen sources. Make sure you are running in Electron.")
            }
        } else {
            alert("This feature is only available in the Electron app, not in web preview.")
        }
    }

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
                        <Select placeholder="Camera">
                            <SelectTrigger isDisabled>
                                <CameraIcon className="text-primary size-4.5" />
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem>No Camera</SelectItem>
                                <SelectItem>Microphone</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select placeholder="Micphone">
                            <SelectTrigger>
                                <MicIcon className="text-primary size-4.5" />
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem>No Camera</SelectItem>
                                <SelectItem>Microphone</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select placeholder="System Sound">
                            <SelectTrigger>
                                <VolumeIcon className="text-primary size-4.5" />
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem>No Camera</SelectItem>
                                <SelectItem>Microphone</SelectItem>
                            </SelectContent>
                        </Select>
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
