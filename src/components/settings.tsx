import type { AdvanceRecordSettings } from "~/types/advance-settings"

import { CloseIcon } from "~/icons/close"

type SettingsChangeArgs =
    | AdvanceRecordSettings
    | ((prev: AdvanceRecordSettings) => AdvanceRecordSettings)

interface Props {
    settings: AdvanceRecordSettings
    onSettingsChange: (args: SettingsChangeArgs) => void
    onClose: () => void
}

function Settings({ settings, onSettingsChange, onClose }: Props) {
    const onSystemSoundChange = () => {
        onSettingsChange((prev) => ({
            ...settings,
            systemSoundEnabled: !prev.systemSoundEnabled,
        }))
    }

    const onAppRecordingChange = () => {
        onSettingsChange((prev) => ({
            ...settings,
            appRecording: !prev.appRecording,
        }))
    }

    return (
        <section className="bg-background shadow-cursor grid grid-rows-[auto_minmax(0,1fr)] overflow-x-hidden rounded-2xl">
            <header
                style={{ WebkitAppRegion: "drag" }}
                className="bg-background mb-2.5 flex w-full items-center gap-4 px-4 pt-2"
            >
                <button
                    className="relative -mr-2 ml-auto grid size-7 shrink-0 place-items-center rounded-full"
                    style={{ WebkitAppRegion: "no-drag" }}
                    onClick={onClose}
                >
                    <CloseIcon strokeWidth={2} className="size-4" />
                </button>
            </header>

            <ul className="space-y-2 overflow-hidden overflow-y-auto px-4 pb-4">
                <button
                    className="group flex w-full items-center justify-between text-sm"
                    data-selected={settings.systemSoundEnabled ? true : false}
                    onClick={onSystemSoundChange}
                >
                    <span>System Sound</span>
                    <span className="bg-muted group-data-[selected=true]:bg-primary flex h-4.5 w-8 justify-start rounded-full p-0.5 transition-all">
                        <span className="bg-background aspect-square h-full translate-x-0 rounded-full transition-transform group-data-[selected=true]:translate-x-full"></span>
                    </span>
                </button>

                <button
                    className="group flex w-full items-center justify-between text-sm"
                    data-selected={settings.appRecording ? true : false}
                    onClick={onAppRecordingChange}
                >
                    <span>Record CursorX</span>
                    <span className="bg-muted group-data-[selected=true]:bg-primary flex h-4.5 w-8 justify-start rounded-full p-0.5 transition-all">
                        <span className="bg-background aspect-square h-full translate-x-0 rounded-full transition-transform group-data-[selected=true]:translate-x-full"></span>
                    </span>
                </button>
            </ul>
        </section>
    )
}

export default Settings
