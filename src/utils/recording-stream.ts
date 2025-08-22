import fs from "fs"
import path from "path"

const streams = new Map<string, fs.WriteStream>()

export function getPartialPath(filePath: string) {
  return `${filePath}.part`
}

export async function openRecordingStream(filePath: string): Promise<string> {
  const partialPath = getPartialPath(filePath)

  await fs.promises.mkdir(path.dirname(partialPath), { recursive: true })

  // If an old partial exists, remove it to start fresh
  try {
    await fs.promises.unlink(partialPath)
  } catch (_) {
    // ignore if not exists
  }

  const ws = fs.createWriteStream(partialPath, {
    flags: "a",
    encoding: undefined,
    highWaterMark: 1024 * 1024, // 1MB buffer
  })
  streams.set(filePath, ws)

  return partialPath
}

export async function writeRecordingChunk(
  filePath: string,
  buffer: Buffer
): Promise<void> {
  const ws = streams.get(filePath)
  if (!ws) throw new Error("Recording stream not opened")

  await new Promise<void>((resolve, reject) => {
    if (!ws.write(buffer)) {
      ws.once("drain", () => resolve())
      ws.once("error", reject)
    } else {
      resolve()
    }
  })
}

export async function closeRecordingStream(filePath: string): Promise<void> {
  const ws = streams.get(filePath)
  if (!ws) return

  await new Promise<void>((resolve, reject) => {
    ws.end(() => resolve())
    ws.once("error", reject)
  })
  streams.delete(filePath)
}

export async function deletePartialRecording(filePath: string): Promise<void> {
  const partialPath = getPartialPath(filePath)
  try {
    await fs.promises.unlink(partialPath)
  } catch (_) {
    // ignore
  }
}

export async function finalizeRecordingStream(filePath: string): Promise<string> {
  // Ensure stream is closed
  await closeRecordingStream(filePath)

  const partialPath = getPartialPath(filePath)

  // If final already exists, remove it (rare)
  try {
    await fs.promises.unlink(filePath)
  } catch (_) {
    // ignore if not exists
  }

  await fs.promises.rename(partialPath, filePath)
  return filePath
}
