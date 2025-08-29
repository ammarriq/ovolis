import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Button, ListBox, ListBoxItem, Popover, Select, SelectValue } from "react-aria-components"

import { CameraIcon } from "~/icons/camera"
import { CloseIcon } from "~/icons/close"
import { CustomScreenIcon } from "~/icons/custom-screen"
import { FullScreenIcon } from "~/icons/full-screen"
import { MicIcon } from "~/icons/mic"
import { ScreenIcon } from "~/icons/screen"
import { SettingsIcon } from "~/icons/settings"
import { VolumeIcon } from "~/icons/volume"
import { WindowIcon } from "~/icons/window"

import AppIcon from "../assets/icons/icon.png"

const Recorder = () => {
    const [modal, setModal] = useState(false)
    const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
    const [selectedSource, setSelectedSource] = useState<ScreenSource>(null)

    const [_isCameraOn, _setIsCameraOn] = useState(true)
    const [_isMicOn, _setIsMicOn] = useState(true)
    const [_isVolumeOn, _setIsVolumeOn] = useState(true)

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
        setModal(false)

        try {
            await window.electronAPI.createFloatingBar({ ...source })
        } catch (error) {
            console.error("Failed to create floating window:", error)
            alert("Failed to create floating window")
        }
    }

    const _getMediaDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            console.log(devices)
        } catch (error) {
            console.error("Failed to enumerate media devices:", error)
        }
    }

    const toggleScreenSelection = () => {
        if (modal) {
            setModal(false)
            window.electronAPI.setDefaultSize()
        } else {
            setModal(true)
            window.electronAPI.setWindowSize(420 + 336, 280)
        }
    }

    return (
        <main className="grid h-screen grid-cols-[266px_400px] gap-4 overflow-hidden p-2">
            <section className="bg-background flex flex-col overflow-x-hidden rounded-2xl shadow-[0px_0px_12px_-5px_rgba(0,0,0,0.35)]">
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
                            className="flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm"
                            onPress={toggleScreenSelection}
                        >
                            <ScreenIcon className="text-primary size-4.5" />
                            <p>Screen</p>
                        </Button>
                    </fieldset>

                    <fieldset className="mt-4 space-y-2">
                        <h3 className="mb-2 text-xs font-bold">Record Settings</h3>
                        <Select placeholder="Camera">
                            <Button className="flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm">
                                <CameraIcon className="text-primary size-4.5" />
                                <SelectValue />
                            </Button>
                            <Popover>
                                <ListBox>
                                    <ListBoxItem>No Camera</ListBoxItem>
                                    <ListBoxItem>Microphone</ListBoxItem>
                                </ListBox>
                            </Popover>
                        </Select>
                        <Select placeholder="Micphone">
                            <Button className="flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm">
                                <MicIcon className="text-primary size-4.5" />
                                <SelectValue />
                            </Button>
                            <Popover>
                                <ListBox>
                                    <ListBoxItem>No Camera</ListBoxItem>
                                    <ListBoxItem>Microphone</ListBoxItem>
                                </ListBox>
                            </Popover>
                        </Select>
                        <Select placeholder="System Sound">
                            <Button className="flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm">
                                <VolumeIcon className="text-primary size-4.5" />
                                <SelectValue />
                            </Button>
                            <Popover>
                                <ListBox>
                                    <ListBoxItem>No Camera</ListBoxItem>
                                    <ListBoxItem>Microphone</ListBoxItem>
                                </ListBox>
                            </Popover>
                        </Select>
                    </fieldset>
                    <Button className="bg-primary text-primary-foreground mt-4 w-full rounded-md px-3 py-2 text-sm">
                        Start Recording
                    </Button>
                </aside>

                {/* <section className="bg-background size-full overflow-hidden rounded-2xl border p-4 shadow-[0px_0px_8px_-3px_rgba(0,0,0,0.35)]">
                    <div className="grid h-full auto-rows-max grid-cols-2 gap-2 overflow-y-auto pr-2">
                        {screenSources.map((source) => (
                            <button
                                key={source.id}
                                className="hover:bg-accent bg-accent/10 ring-border flex flex-col gap-2 rounded-md border"
                                onClick={() => selectSource(source)}
                            >
                                <div className="h-24 w-full shrink-0">
                                    <img
                                        src={source.thumbnail}
                                        className="size-full rounded-t-md object-cover"
                                        alt={source.name}
                                    />
                                </div>
                                <p className="truncate px-2 pb-2 text-sm">{source.name}</p>
                            </button>
                        ))}
                    </div>
                </section> */}
            </section>

            {modal ? (
                <section className="bg-background grid grid-rows-[auto_minmax(0,1fr)] overflow-x-hidden rounded-2xl shadow-[0px_0px_12px_-5px_rgba(0,0,0,0.35)]">
                    <header
                        style={{ WebkitAppRegion: "drag" }}
                        className="bg-background mb-2.5 flex w-full items-center justify-end gap-4 px-4 pt-2"
                    >
                        <button
                            className="relative -mr-2 grid size-7 shrink-0 place-items-center rounded-full"
                            style={{ WebkitAppRegion: "no-drag" }}
                            onClick={toggleScreenSelection}
                        >
                            <CloseIcon strokeWidth={2} className="size-4" />
                        </button>
                    </header>

                    <div className="grid h-full auto-rows-max grid-cols-2 gap-2 overflow-y-auto px-4 pb-4">
                        {screenSources.map((source) => (
                            <button
                                key={source.id}
                                className="hover:bg-accent bg-accent/10 ring-border flex flex-col gap-2 rounded-md border"
                                onClick={() => selectSource(source)}
                            >
                                <div className="h-24 w-full shrink-0">
                                    <img
                                        src={source.thumbnail}
                                        className="size-full rounded-t-md object-cover"
                                        alt={source.name}
                                    />
                                </div>
                                <p className="truncate px-2 pb-2 text-sm">{source.name}</p>
                            </button>
                        ))}
                    </div>
                </section>
            ) : null}
        </main>
    )
}

const root = createRoot(document.body)
root.render(<Recorder />)
