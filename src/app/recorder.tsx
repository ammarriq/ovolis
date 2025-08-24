import type { ScreenSource } from "~/types/screen-sources"

import { CloseIcon } from "~/icons/close"
import { WindowIcon } from "~/icons/window"
import { useEffect, useState } from "react"
import { VolumeIcon } from "~/icons/volume"
import { createRoot } from "react-dom/client"
import { FullScreenIcon } from "~/icons/full-screen"

import { MicIcon } from "~/icons/mic"
import { cn } from "~/utils/cn"
import { SettingsIcon } from "~/icons/settings"
import { CropScreenIcon } from "~/icons/crop-screen"
import { CustomScreenIcon } from "~/icons/custom-screen"
import { CameraIcon } from "~/icons/camera"

import Header from "./-header"
import { DragIcon } from "~/icons/drag"
import AppIcon from "../assets/icons/icon.png"
import {
    Button,
    ListBox,
    ListBoxItem,
    Menu,
    MenuItem,
    MenuTrigger,
    Popover,
    Select,
    SelectValue,
} from "react-aria-components"

const Recorder = () => {
    const [modal, setModal] = useState(false)
    const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
    const [selectedSource, setSelectedSource] = useState<ScreenSource>(null)

    const [isCameraOn, setIsCameraOn] = useState(true)
    const [isMicOn, setIsMicOn] = useState(true)
    const [isVolumeOn, setIsVolumeOn] = useState(true)

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

    const getMediaDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            console.log(devices)
        } catch (error) {
            console.error("Failed to enumerate media devices:", error)
        }
    }

    return (
        <div className="flex flex-col p-2">
            <div
                className="bg-background flex items-center gap-4 overflow-y-auto rounded-2xl p-4 shadow-[0px_0px_8px_-3px_rgba(0,0,0,0.35)]"
                style={{ WebkitAppRegion: "drag" }}
            >
                <div
                    className="size-7 shrink-0"
                    style={{ backgroundImage: `url(${AppIcon})`, backgroundSize: "cover" }}
                />

                <div className="h-6 border-r"></div>

                <div className="flex gap-2">
                    <button
                        className="bg-primary text-primary-foreground relative grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                    >
                        <FullScreenIcon className="size-4.5" />
                    </button>
                    <button
                        className="relative grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                    >
                        <CustomScreenIcon className="size-4.5" />
                    </button>
                    <button
                        className="relative grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                    >
                        <WindowIcon className="size-4.5" />
                    </button>
                </div>

                {/* <div className="h-6 border-r"></div>

                <div className="flex gap-2">
                    <button
                        className="relative grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                        onClick={() => setIsCameraOn(!isCameraOn)}
                    >
                        <CameraIcon className="size-4.5" />
                        {!isCameraOn ? (
                            <div className="border-foreground absolute top-1/2 left-1/2 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-2"></div>
                        ) : null}
                    </button>
                    <button
                        className="relative grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                        onClick={() => setIsMicOn(!isMicOn)}
                    >
                        <MicIcon className="size-4.5" />
                        {!isMicOn ? (
                            <div className="border-foreground absolute top-1/2 left-1/2 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-2"></div>
                        ) : null}
                    </button>
                    <button
                        className="relative grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                        onClick={() => setIsVolumeOn(!isVolumeOn)}
                    >
                        <VolumeIcon className="size-4.5" />
                        {!isVolumeOn ? (
                            <div className="border-foreground absolute top-1/2 left-1/2 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-2"></div>
                        ) : null}
                    </button>
                </div> */}

                <div className="h-6 border-r"></div>

                <div className="flex gap-2">
                    <button
                        className="relative grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                    >
                        <SettingsIcon strokeWidth={2} className="size-4.5" />
                    </button>
                    <button
                        className="relative grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                        onClick={() => window.electronAPI?.closeWindow()}
                    >
                        <CloseIcon strokeWidth={2} className="size-4.5" />
                    </button>
                </div>

                {/* <main className="bg-background grow rounded-t-2xl p-4 shadow-[0px_-2px_8px_-8px_rgba(0,0,0,0.35)]">
                    <Select placeholder="Camera">
                        <Button className="bg-accent w-full rounded-md border px-2 py-1 text-left">
                            <SelectValue />
                        </Button>
                        <Popover>
                            <ListBox>
                                <ListBoxItem>No Camera</ListBoxItem>
                                <ListBoxItem>Microphone</ListBoxItem>
                            </ListBox>
                        </Popover>
                    </Select>
                </main> */}

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

            {/* <div className="bg-background mt-4 w-80 rounded-2xl p-4 shadow-[0px_0px_8px_-3px_rgba(0,0,0,0.35)]">
                <p>Recording in progress...</p>
            </div> */}
        </div>
    )
}

const root = createRoot(document.body)
root.render(<Recorder />)
