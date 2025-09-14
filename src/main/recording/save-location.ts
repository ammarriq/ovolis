let userSaveDirectory: string | null = null

export function setSaveDirectory(dir: string | null) {
    userSaveDirectory = dir && dir.trim() !== "" ? dir : null
}

export function getSaveDirectory(): string | null {
    return userSaveDirectory
}

