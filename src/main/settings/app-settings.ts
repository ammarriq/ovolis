import type { AppSettings } from "~/types/app-settings"

import { app } from "electron"

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"

import { tryCatch } from "~/utils/try-catch"

const defaultSettings: AppSettings = {
    shouldRecordApp: false,
    saveLocation: null,
}

let cachedSettings: AppSettings | null = null

function getSettingsPath(): string {
    const userDataPath = app.getPath("userData")
    return path.join(userDataPath, "app-settings.json")
}

export async function loadSettings(): Promise<AppSettings> {
    if (cachedSettings) {
        return cachedSettings
    }

    try {
        const settingsPath = getSettingsPath()
        const data = await readFile(settingsPath, "utf-8")
        const settings = JSON.parse(data) as AppSettings

        // Merge with defaults to ensure all properties exist
        cachedSettings = { ...defaultSettings, ...settings }
        return cachedSettings
    } catch (_error) {
        // If file doesn't exist or is corrupted, return defaults
        cachedSettings = { ...defaultSettings }
        return cachedSettings
    }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const currentSettings = await loadSettings()
    const updatedSettings = { ...currentSettings, ...settings }

    const { error } = await tryCatch(async () => {
        const settingsPath = getSettingsPath()
        const settingsDir = path.dirname(settingsPath)

        // Ensure directory exists
        await mkdir(settingsDir, { recursive: true })

        // Save to file
        await writeFile(settingsPath, JSON.stringify(updatedSettings, null, 2), "utf-8")

        // Update cache
        cachedSettings = updatedSettings
    })

    if (error) {
        console.error("Failed to save settings:", error)
        throw error
    }
}

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await loadSettings()
    return settings[key]
}

export async function setSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
): Promise<void> {
    await saveSettings({ [key]: value } as Partial<AppSettings>)
}
