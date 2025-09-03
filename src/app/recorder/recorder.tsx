import type { RecordConfig } from "~/types/record-config"
import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useRef, useState } from "react"
import { Button } from "react-aria-components"

import AppIcon from "~/assets/icons/icon.png"
import Screens from "~/components/screens"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import Switch from "~/components/ui/switch"
import useDevices from "~/hooks/use-devices"
import useDisplayMetrics from "~/hooks/use-display-metrics"
import useScreenSources from "~/hooks/use-screen-sources"
import { CameraIcon } from "~/icons/camera"
import { CloseIcon } from "~/icons/close"
import { MicIcon } from "~/icons/mic"
import { ScreenIcon } from "~/icons/screen"
import { VolumeIcon } from "~/icons/volume"

interface Props {
    onRecord: (config: RecordConfig) => void
}

function Recorder({ onRecord }: Props) {
    const [modal, setModal] = useState(false)
    const [selectedSource, setSelectedSource] = useState<ScreenSource>()

    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
    const [selectedMicId, setSelectedMicId] = useState<string | null>(null)
    const [isSystemSoundEnabled, setIsSystemSoundEnabled] = useState(true)

    const screenSources = useScreenSources()
    const displayMetrics = useDisplayMetrics({
        selectedSource,
    })

    // Only use device lists; manage selections locally to avoid auto-resets
    const { mics, cameras } = useDevices({
        onMicChange: () => {},
        onCameraChange: setSelectedCameraId,
    })

    // Recording timer effect

    // Auto-select default screen source (prefer entire screen)
    useEffect(() => {
        if (!selectedSource && screenSources.length > 0) {
            const entireScreen =
                screenSources.find((s) => s.id?.startsWith("screen:")) ||
                screenSources.find((s) => /entire\s*screen/i.test(s.name)) ||
                screenSources[0]
            setSelectedSource(entireScreen)
        }
    }, [screenSources, selectedSource])

    // Auto-select microphone only once on initial mount (if available)
    const didInitMicRef = useRef(false)
    useEffect(() => {
        if (!didInitMicRef.current && mics.length > 0) {
            setSelectedMicId((prev) => (prev === null ? mics[0].deviceId : prev))
            didInitMicRef.current = true
        }
    }, [mics])

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
                            <p className="w-0 grow truncate">
                                {selectedSource?.name ?? "Entire Screen"}
                            </p>
                        </Button>
                    </fieldset>

                    <fieldset className="mt-4 space-y-2">
                        <h3 className="mb-2 text-xs font-bold">Record Settings</h3>
                        <Select
                            aria-label="Select Camera"
                            placeholder="Camera"
                            selectedKey={selectedCameraId ?? undefined}
                            onSelectionChange={(key) => {
                                setSelectedCameraId((key as string) || null)
                            }}
                        >
                            <SelectTrigger className="py-1.5">
                                <CameraIcon className="text-primary size-4.5" />
                                <SelectValue />
                                <Switch isOn={selectedCameraId !== null} />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem id="">No Camera</SelectItem>
                                {cameras.map((c, idx) => (
                                    <SelectItem
                                        key={c.deviceId}
                                        id={c.deviceId}
                                        aria-label={c.label || `Camera ${idx + 1}`}
                                    >
                                        {c.label || `Camera ${idx + 1}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            aria-label="Select Microphone"
                            placeholder="Microphone"
                            selectedKey={selectedMicId ?? undefined}
                            onSelectionChange={(key) => {
                                setSelectedMicId((key as string) || null)
                            }}
                        >
                            <SelectTrigger className="py-1.5">
                                <MicIcon className="text-primary size-4.5" />
                                <SelectValue />
                                <Switch isOn={selectedMicId !== null} />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem id="">No Microphone</SelectItem>
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
                            <Switch isOn={isSystemSoundEnabled} />
                        </Button>
                    </fieldset>
                    <Button
                        className="bg-primary text-primary-foreground mt-4 w-full rounded-md px-3 py-2 text-sm"
                        onPress={() =>
                            selectedSource &&
                            onRecord({
                                source: selectedSource,
                                selectedMicId,
                                selectedCameraId,
                                isSystemSoundEnabled,
                            })
                        }
                    >
                        Start Recording
                    </Button>
                </aside>
            </section>

            {modal ? (
                <Screens
                    displayMetrics={displayMetrics}
                    screenSources={screenSources}
                    selectedScreen={selectedSource}
                    onScreenSelected={setSelectedSource}
                    onClose={toggleScreenSelection}
                />
            ) : null}
        </main>
    )
}

export default Recorder
