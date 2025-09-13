import { app } from "electron"

import { spawn } from "child_process"
import fs from "fs"
import path from "path"

import { tryCatch } from "~/utils/try-catch"

async function fileExists(p: string): Promise<boolean> {
    const { error } = await tryCatch(fs.promises.access(p, fs.constants.X_OK))
    if (error) {
        const { error } = await tryCatch(fs.promises.access(p, fs.constants.F_OK))
        if (error) return false
    }

    return true
}

async function resolveFfmpegPath(): Promise<string | null> {
    const candidates: string[] = []

    // 1) Project root (dev)
    candidates.push(path.resolve(process.cwd(), "binaries", "ffmpeg.exe"))

    // 2) App path (e.g., asar-unpacked sibling)
    candidates.push(path.resolve(app.getAppPath(), "..", "binaries", "ffmpeg.exe"))

    // 3) resourcesPath for packaged builds
    candidates.push(path.join(process.resourcesPath, "binaries", "ffmpeg.exe"))

    for (const c of candidates) {
        if (await fileExists(c)) return c
    }

    return null
}

export async function fixMp4Metadata(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase()
    if (ext !== ".mp4") return filePath

    const ffmpegPath = await resolveFfmpegPath()
    if (!ffmpegPath) {
        console.warn("FFmpeg not found; skipping metadata fix for:", filePath)
        return filePath
    }

    const dir = path.dirname(filePath)
    const base = path.basename(filePath, ext)
    const tmpOut = path.join(dir, `${base}.fixed${ext}`)

    // Ensure tmpOut doesn't exist
    await tryCatch(fs.promises.unlink(tmpOut))

    await new Promise<void>((resolve, reject) => {
        const proc = spawn(ffmpegPath, [
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            filePath,
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            tmpOut,
        ])

        proc.on("error", reject)
        proc.on("exit", (code) => {
            if (code === 0) resolve()
            else reject(new Error(`ffmpeg exited with code ${code}`))
        })
    })

    // Replace original atomically (best-effort on Windows)
    await tryCatch(fs.promises.unlink(filePath))
    await fs.promises.rename(tmpOut, filePath)

    return filePath
}
