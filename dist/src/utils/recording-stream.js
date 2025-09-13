import fs from "fs";
import path from "path";
const streams = new Map();
export function getPartialPath(filePath) {
    return `${filePath}.part`;
}
export async function openRecordingStream(filePath) {
    const partialPath = getPartialPath(filePath);
    await fs.promises.mkdir(path.dirname(partialPath), { recursive: true });
    // If an old partial exists, remove it to start fresh
    try {
        await fs.promises.unlink(partialPath);
    }
    catch (_) {
        // ignore if not exists
    }
    const ws = fs.createWriteStream(partialPath, {
        flags: "a",
        encoding: undefined,
        highWaterMark: 1024 * 1024, // 1MB buffer
    });
    streams.set(filePath, ws);
    return partialPath;
}
export async function writeRecordingChunk(filePath, buffer) {
    const ws = streams.get(filePath);
    if (!ws)
        throw new Error("Recording stream not opened");
    await new Promise((resolve, reject) => {
        if (!ws.write(buffer)) {
            ws.once("drain", () => resolve());
            ws.once("error", reject);
        }
        else {
            resolve();
        }
    });
}
export async function closeRecordingStream(filePath) {
    const ws = streams.get(filePath);
    if (!ws)
        return;
    await new Promise((resolve, reject) => {
        ws.end(() => resolve());
        ws.once("error", reject);
    });
    streams.delete(filePath);
}
export async function deletePartialRecording(filePath) {
    const partialPath = getPartialPath(filePath);
    try {
        await fs.promises.unlink(partialPath);
    }
    catch (_) {
        // ignore
    }
}
export async function finalizeRecordingStream(filePath) {
    // Ensure stream is closed
    await closeRecordingStream(filePath);
    const partialPath = getPartialPath(filePath);
    // If final already exists, remove it (rare)
    try {
        await fs.promises.unlink(filePath);
    }
    catch (_) {
        // ignore if not exists
    }
    await fs.promises.rename(partialPath, filePath);
    return filePath;
}
//# sourceMappingURL=recording-stream.js.map