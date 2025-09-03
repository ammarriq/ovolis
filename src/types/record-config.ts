import type { ScreenSource } from "./screen-sources"

export interface RecordConfig {
    source: ScreenSource
    selectedMicId: string | null
    selectedCameraId: string | null
    isSystemSoundEnabled: boolean
}

