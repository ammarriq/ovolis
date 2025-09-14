import "@fontsource-variable/noto-sans-lao"
import "~/index.css"

import type { AdvanceRecordSettings } from "~/types/advance-settings"
import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "react-aria-components"

import AppIcon from "~/assets/icons/icon.png"
import Screens from "~/components/screens"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Switch, SwitchThumb, SwitchTrack } from "~/components/ui/switch"
import useAppSettings from "~/hooks/use-app-settings"
import useDevices from "~/hooks/use-devices"
import useDevicesReady from "~/hooks/use-devices-ready"
import useDisplayMetrics from "~/hooks/use-display-metrics"
import useScreenSources from "~/hooks/use-screen-sources"
import { CameraIcon } from "~/icons/camera"
import { CloseIcon } from "~/icons/close"
import { MicIcon } from "~/icons/mic"
import { ScreenIcon } from "~/icons/screen"
import { SettingsIcon } from "~/icons/settings"
import { VolumeIcon } from "~/icons/volume"
import { cn } from "~/utils/cn"

function Recorder() {
    const [screenDialog, setScreenDialog] = useState(false)
    const [settingsDialog, setSettingsDialog] = useState(false)
    const [selectedSource, setSelectedSource] = useState<ScreenSource>()
    const [_settings, _setSettings] = useState<AdvanceRecordSettings>()

    const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
    const [selectedMicId, setSelectedMicId] = useState<string | null>(null)
    const [isSystemSoundEnabled, setIsSystemSoundEnabled] = useState(false)

    const { mics, cameras } = useDevices()
    const areDevicesReady = useDevicesReady()
    const screenSources = useScreenSources()
    const displayMetrics = useDisplayMetrics({ selectedSource })
    const { isAppRecording, saveLocation, handleIsAppRecording, handleSaveLocation } =
        useAppSettings()

    useEffect(() => {
        if (!selectedSource && screenSources.length > 0) {
            const entireScreen =
                screenSources.find((s) => s.id?.startsWith("screen:")) ||
                screenSources.find((s) => /entire\s*screen/i.test(s.name)) ||
                screenSources[0]
            setSelectedSource(entireScreen)
        }
    }, [screenSources, selectedSource])

    const didInitMicRef = useRef(false)
    useEffect(() => {
        if (!didInitMicRef.current && mics.length > 0) {
            setSelectedMicId((prev) => (prev === null ? mics[0].deviceId : prev))
            didInitMicRef.current = true
        }
    }, [mics])

    const toggleScreenSelection = () => {
        if (screenDialog) {
            setScreenDialog(false)
            window.electronAPI.setWindowSize()
        } else {
            setScreenDialog(true)
            setSettingsDialog(false)
            window.electronAPI.setWindowSize(420 + 280)
        }
    }

    if (!areDevicesReady) return null

    return (
        <main
            className={cn(
                "grid h-screen grid-cols-[266px_400px] gap-4 overflow-hidden p-2",
                settingsDialog ? "grid-cols-[266px_300px]" : "",
            )}
        >
            <section className="bg-background shadow-cursor flex flex-col overflow-hidden rounded-2xl">
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
                            selectedKey={selectedCameraId ?? "none"}
                            onSelectionChange={(key) => {
                                const camera = key !== "none" ? String(key) : null
                                setSelectedCameraId(camera)
                                if (camera) {
                                    window.electronAPI.openCamera(camera)
                                } else {
                                    window.electronAPI.closeCamera()
                                }
                            }}
                        >
                            <SelectTrigger>
                                <CameraIcon className="text-primary size-4.5" />
                                <SelectValue />
                                <Switch isSelected={selectedCameraId !== null} isDisabled />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem id="none">No Camera</SelectItem>
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
                            selectedKey={selectedMicId ?? "none"}
                            onSelectionChange={(key) => {
                                const mic = key !== "none" ? String(key) : null
                                setSelectedMicId(mic)
                            }}
                        >
                            <SelectTrigger>
                                <MicIcon className="text-primary size-4.5" />
                                <SelectValue />
                                <Switch isSelected={selectedMicId !== null} isDisabled />
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

                        <Switch
                            className="z-10 flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm whitespace-nowrap disabled:opacity-60 [&>span]:w-0 [&>span]:grow [&>span]:truncate [&>svg]:size-4.5 [&>svg]:shrink-0"
                            onChange={setIsSystemSoundEnabled}
                        >
                            <VolumeIcon className="text-primary size-4.5" />
                            <p>System Sound</p>
                            <SwitchTrack>
                                <SwitchThumb />
                            </SwitchTrack>
                        </Switch>
                    </fieldset>

                    <div className="mt-4 flex gap-2">
                        <Button
                            className="bg-primary text-primary-foreground grow rounded-md px-3 py-2 text-sm"
                            onPress={() => {
                                if (selectedSource) {
                                    window.electronAPI.createRecordBar({
                                        source: selectedSource,
                                        selectedMicId,
                                        selectedCameraId,
                                        isSystemSoundEnabled: isSystemSoundEnabled,
                                    })
                                }
                            }}
                        >
                            Start Recording
                        </Button>

                        <Popover>
                            <PopoverTrigger className="max-w-fit">
                                <SettingsIcon className="text-primary size-4.5" />
                            </PopoverTrigger>
                            <PopoverContent className="w-56 space-y-1" placement="top right">
                                <Switch
                                    className="group flex w-full items-center justify-between rounded-md px-3 py-1.75 text-sm"
                                    isSelected={isAppRecording}
                                    onChange={handleIsAppRecording}
                                >
                                    <span>Record CursorX</span>
                                    <SwitchTrack className="bg-[#F3F4F6]">
                                        <SwitchThumb className="bg-white" />
                                    </SwitchTrack>
                                </Switch>

                                <Button
                                    className="group flex w-full items-center justify-between rounded-md px-3 py-1.75 text-sm"
                                    onPress={handleSaveLocation}
                                >
                                    <span>Save Location</span>
                                    <span title={saveLocation || "Default"}>
                                        {saveLocation ? saveLocation : "Default"}
                                    </span>
                                </Button>
                            </PopoverContent>
                        </Popover>
                    </div>
                </aside>
            </section>

            {screenDialog ? (
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

const root = createRoot(document.body)
root.render(<Recorder />)
