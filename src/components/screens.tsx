import type { ScreenSource } from "~/types/screen-sources"

import { useState } from "react"

import useLiveVideo from "~/hooks/use-live-video"
import { ArrowLeftIcon } from "~/icons/arrow-left"
import { CloseIcon } from "~/icons/close"

import { Menu, MenuContent, MenuItem, MenuTrigger, SubmenuTrigger } from "./ui/menu"

interface Props {
    displayMetrics: {
        width: number
        height: number
    } | null
    screenSources: ScreenSource[]
    selectedScreen: ScreenSource | null
    onScreenSelected: (screen: ScreenSource) => void
    onClose: () => void
}

// Common resolution presets per aspect ratio (largest to smallest)
const PRESETS_16_9: Array<[number, number]> = [
    [3840, 2160],
    [2560, 1440],
    [1920, 1080],
    [1600, 900],
    [1366, 768],
    [1280, 720],
    [1024, 576],
]

const PRESETS_16_10: Array<[number, number]> = [
    [2560, 1600],
    [1920, 1200],
    [1680, 1050],
    [1440, 900],
    [1280, 800],
]

const PRESETS_4_3: Array<[number, number]> = [
    [2048, 1536],
    [1600, 1200],
    [1400, 1050],
    [1280, 960],
    [1024, 768],
    [800, 600],
]

const PRESETS_1_1: Array<[number, number]> = [
    [2048, 2048],
    [1920, 1920],
    [1600, 1600],
    [1200, 1200],
    [1024, 1024],
    [800, 800],
    [512, 512],
]

function generateSizesToFit(
    maxW: number,
    maxH: number,
    presets: Array<[number, number]>,
): Array<[number, number]> {
    const safeMaxW = Number.isFinite(maxW) ? maxW : Number.POSITIVE_INFINITY
    const safeMaxH = Number.isFinite(maxH) ? maxH : Number.POSITIVE_INFINITY

    return presets
        .map(([w, h]) => {
            const scale = Math.min(safeMaxW / w, safeMaxH / h, 1)
            const sw = Math.max(1, Math.floor(w * scale)) & ~1 // even width
            const sh = Math.max(1, Math.floor(h * scale)) & ~1 // even height
            return [sw, sh] as [number, number]
        })
        .filter(([w, h]) => w > 0 && h > 0)
        .filter((v, i, a) => a.findIndex((t) => t[0] === v[0] && t[1] === v[1]) === i)
        .sort((a, b) => b[0] * b[1] - a[0] * a[1])
}

function Screens({
    displayMetrics,
    screenSources,
    selectedScreen,
    onScreenSelected,
    onClose,
}: Props) {
    const sizes16x9 = generateSizesToFit(
        displayMetrics?.width ?? Number.POSITIVE_INFINITY,
        displayMetrics?.height ?? Number.POSITIVE_INFINITY,
        PRESETS_16_9,
    )
    const sizes16x10 = generateSizesToFit(
        displayMetrics?.width ?? Number.POSITIVE_INFINITY,
        displayMetrics?.height ?? Number.POSITIVE_INFINITY,
        PRESETS_16_10,
    )
    const sizes4x3 = generateSizesToFit(
        displayMetrics?.width ?? Number.POSITIVE_INFINITY,
        displayMetrics?.height ?? Number.POSITIVE_INFINITY,
        PRESETS_4_3,
    )
    const sizes1x1 = generateSizesToFit(
        displayMetrics?.width ?? Number.POSITIVE_INFINITY,
        displayMetrics?.height ?? Number.POSITIVE_INFINITY,
        PRESETS_1_1,
    )

    const { videoRef } = useLiveVideo({ screenId: selectedScreen?.id })
    const [isScreenOpen, setIsScreenOpen] = useState(false)

    const handleResize = async (width: number, height: number) => {
        if (!selectedScreen) return
        // Only resize if the selected source is a specific window
        if (selectedScreen.id?.startsWith("window:")) {
            try {
                const res = await window.electronAPI.resizeWindow({
                    appName: selectedScreen.name,
                    width,
                    height,
                })
                console.log(res)
            } catch (e) {
                console.error(e)
            }
        } else {
            console.log("Resize is only applicable to window sources.")
        }
    }

    return (
        <section className="bg-background shadow-cursor grid grid-rows-[auto_minmax(0,1fr)] overflow-x-hidden rounded-2xl">
            <header
                style={{ WebkitAppRegion: "drag" }}
                className="bg-background mb-2.5 flex w-full items-center gap-4 px-4 pt-2"
            >
                {selectedScreen ? (
                    <button
                        className="relative -mr-2 grid size-7 shrink-0 place-items-center rounded-full"
                        style={{ WebkitAppRegion: "no-drag" }}
                        onClick={() => setIsScreenOpen(false)}
                    >
                        <ArrowLeftIcon strokeWidth={2} className="size-4" />
                    </button>
                ) : null}

                <button
                    className="relative -mr-2 ml-auto grid size-7 shrink-0 place-items-center rounded-full"
                    style={{ WebkitAppRegion: "no-drag" }}
                    onClick={onClose}
                >
                    <CloseIcon strokeWidth={2} className="size-4" />
                </button>
            </header>

            <aside className="grid overflow-y-auto px-4 pb-4">
                {isScreenOpen ? (
                    <div
                        className="hover:bg-accent bg-accent/10 ring-border relative grid w-full gap-2 rounded-md border"
                        // onClick={() => selectSource(source)}
                    >
                        <Menu>
                            <MenuTrigger
                                isDisabled={!selectedScreen.id?.startsWith("window:")}
                                className="shadow-cursor absolute top-2 left-2 max-w-max border disabled:opacity-0"
                            >
                                Resize
                            </MenuTrigger>
                            <MenuContent className="w-40">
                                <SubmenuTrigger>
                                    <MenuItem>16:9</MenuItem>
                                    <MenuContent className="w-40">
                                        {sizes16x9.map(([w, h]) => (
                                            <MenuItem
                                                key={`16x9-${w}x${h}`}
                                                onAction={() => handleResize(w, h)}
                                            >
                                                {`${w}x${h}`}
                                            </MenuItem>
                                        ))}
                                    </MenuContent>
                                </SubmenuTrigger>
                                <SubmenuTrigger>
                                    <MenuItem>16:10</MenuItem>
                                    <MenuContent className="w-40">
                                        {sizes16x10.map(([w, h]) => (
                                            <MenuItem
                                                key={`16x10-${w}x${h}`}
                                                onAction={() => handleResize(w, h)}
                                            >
                                                {`${w}x${h}`}
                                            </MenuItem>
                                        ))}
                                    </MenuContent>
                                </SubmenuTrigger>
                                <SubmenuTrigger>
                                    <MenuItem>4:3</MenuItem>
                                    <MenuContent className="w-40">
                                        {sizes4x3.map(([w, h]) => (
                                            <MenuItem
                                                key={`4x3-${w}x${h}`}
                                                onAction={() => handleResize(w, h)}
                                            >
                                                {`${w}x${h}`}
                                            </MenuItem>
                                        ))}
                                    </MenuContent>
                                </SubmenuTrigger>
                                <SubmenuTrigger>
                                    <MenuItem>1:1</MenuItem>
                                    <MenuContent className="w-40">
                                        {sizes1x1.map(([w, h]) => (
                                            <MenuItem
                                                key={`1x1-${w}x${h}`}
                                                onAction={() => handleResize(w, h)}
                                            >
                                                {`${w}x${h}`}
                                            </MenuItem>
                                        ))}
                                    </MenuContent>
                                </SubmenuTrigger>
                                <MenuItem>Custom</MenuItem>
                            </MenuContent>
                        </Menu>
                        <div className="relative size-full overflow-hidden">
                            <video
                                ref={videoRef}
                                className="absolute size-full rounded-md object-cover"
                                autoPlay
                                muted
                                playsInline
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid h-full auto-rows-max grid-cols-2 gap-2">
                        {screenSources.map((source) => (
                            <button
                                key={source.id}
                                className="hover:bg-accent bg-accent/10 ring-border flex flex-col gap-2 rounded-md border"
                                onClick={() => {
                                    onScreenSelected(source)
                                    if (source.id?.startsWith("window:")) {
                                        setIsScreenOpen(true)
                                    } else {
                                        onClose()
                                    }
                                }}
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
                )}
            </aside>
        </section>
    )
}

export default Screens
