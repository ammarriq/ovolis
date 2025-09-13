import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "@fontsource-variable/noto-sans-lao";
import "~/index.css";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "react-aria-components";
import useAudioMixer from "~/hooks/use-audio-mixer";
import useAudioSources from "~/hooks/use-audio-sources";
import useCameraOverlay from "~/hooks/use-camera-overlay";
import useRecordConfig from "~/hooks/use-record-config";
import useVideoCompositor from "~/hooks/use-video-compositor";
import { DeleteIcon } from "~/icons/delete";
import { PauseIcon } from "~/icons/pause";
import { PlayIcon } from "~/icons/play";
import { StopIcon } from "~/icons/stop";
import { tryCatch } from "~/utils/try-catch";
const electronAPI = window.electronAPI;
function FloatingBar({ source, selectedMicId, selectedCameraId, isSystemSoundEnabled, isVisible, onClose, }) {
    const { createCameraOverlay } = useCameraOverlay();
    const { createVideoCompositor } = useVideoCompositor();
    const { createAudioSources } = useAudioSources();
    const { createAudioMixer } = useAudioMixer();
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [_isStartingRecording, setIsStartingRecording] = useState(false);
    const recordingTimerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const systemAudioStreamRef = useRef(null);
    const micStreamRef = useRef(null);
    const audioCtxRef = useRef(null);
    const audioDestRef = useRef(null);
    const chunksRef = useRef([]);
    const filePathRef = useRef(null);
    const writeQueueRef = useRef(Promise.resolve());
    const streamingEnabledRef = useRef(false);
    const closedCameraForRecordingRef = useRef(false);
    useEffect(() => {
        if (isRecording && !isPaused) {
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        }
        else {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
            if (!isRecording) {
                setRecordingTime(0);
            }
        }
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, [isRecording, isPaused]);
    useEffect(() => {
        if (!isRecording && source) {
            void startRecording();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const logDisplayDiagnostics = () => {
        console.log("=== RECORDING DIAGNOSTICS ===");
        console.log("Screen dimensions:", {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            pixelDepth: screen.pixelDepth,
            colorDepth: screen.colorDepth,
        });
        console.log("Device pixel ratio:", window.devicePixelRatio);
    };
    const cleanupStreams = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
        }
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach((t) => t.stop());
            cameraStreamRef.current = null;
        }
        if (systemAudioStreamRef.current) {
            systemAudioStreamRef.current.getTracks().forEach((t) => t.stop());
            systemAudioStreamRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((t) => t.stop());
            micStreamRef.current = null;
        }
        if (audioDestRef.current) {
            audioDestRef.current.stream.getTracks().forEach((t) => t.stop());
            audioDestRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => { });
            audioCtxRef.current = null;
        }
    };
    const startRecording = async () => {
        if (!electronAPI || !source) {
            alert("Recording is not available or source not selected.");
            return;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            return;
        }
        setIsStartingRecording(true);
        try {
            // Ensure our app windows are excluded from capture during recording
            // await electronAPI.setExcludeAppWindowsFromCapture(true)
            logDisplayDiagnostics();
            const recordingConfigStr = await electronAPI.startRecording({
                id: source.id,
                name: source.name,
            });
            const recordingConfig = JSON.parse(recordingConfigStr);
            filePathRef.current = String(recordingConfig.filePath);
            const recordResult = await tryCatch(electronAPI.openRecordingStream(recordingConfig.filePath));
            if (recordResult.error) {
                streamingEnabledRef.current = false;
            }
            if (recordResult.data) {
                streamingEnabledRef.current = true;
                writeQueueRef.current = Promise.resolve();
            }
            const { data: stream, error: streamError } = await tryCatch(navigator.mediaDevices.getUserMedia(recordingConfig.constraints));
            if (streamError) {
                console.warn("Primary capture method failed, trying fallback:", streamError);
            }
            // Acquire audio sources via hook
            const { systemAudioStream, micStream } = await createAudioSources({
                isSystemSoundEnabled,
                selectedMicId,
                primaryStream: stream,
            });
            // Mix audio via hook (handles fallback selection internally)
            const mixer = await createAudioMixer({
                isSystemSoundEnabled,
                primaryStream: stream,
                systemAudioStream,
                micStream,
            });
            // Persist audio nodes for cleanup
            audioCtxRef.current = mixer.audioCtx;
            audioDestRef.current = mixer.audioDest;
            const mixedAudioTrack = mixer.outputTrack;
            const preferredAudio = mixedAudioTrack;
            // Compose screen + optional camera overlay into a canvas and capture it
            const screenVideoTrack = stream.getVideoTracks()[0];
            const s = screenVideoTrack?.getSettings ? screenVideoTrack.getSettings() : {};
            const compFps = s.frameRate ?? 30;
            const padding = 24; // px
            const overlay = await createCameraOverlay({
                selectedCameraId,
                compFps,
                padding,
            });
            if (overlay.closedCameraForRecording)
                closedCameraForRecordingRef.current = true;
            const compositor = await createVideoCompositor({
                screenStream: stream,
                compFps,
                overlayDraw: overlay.draw,
            });
            const combinedStream = new MediaStream([
                ...compositor.canvasStream.getVideoTracks(),
                ...(preferredAudio ? [preferredAudio] : []),
            ]);
            screenStreamRef.current = stream;
            cameraStreamRef.current = overlay.camStream ?? null;
            systemAudioStreamRef.current = systemAudioStream;
            micStreamRef.current = micStream;
            streamRef.current = combinedStream;
            let mimeType = "video/mp4;codecs=vp9";
            let videoBitrate = 8000000;
            console.log("=== CODEC DIAGNOSTICS ===");
            console.log("VP9 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=vp9"));
            console.log("VP8 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=vp8"));
            console.log("H264 support:", MediaRecorder.isTypeSupported("video/mp4;codecs=h264"));
            if (MediaRecorder.isTypeSupported("video/mp4;codecs=vp9")) {
                mimeType = "video/mp4;codecs=vp9";
                console.log("Selected codec: VP9 (preferred)");
            }
            else if (MediaRecorder.isTypeSupported("video/mp4;codecs=vp8")) {
                mimeType = "video/mp4;codecs=vp8";
                console.log("Selected codec: VP8 (fallback)");
            }
            else if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264")) {
                mimeType = "video/mp4;codecs=h264";
                console.log("Selected codec: H264-in-mp4 (last resort)");
            }
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack?.getSettings ? videoTrack.getSettings() : {};
            const width = settings.width ?? 1920;
            const height = settings.height ?? 1080;
            const fps = settings.frameRate ?? 30;
            const targetBpppf = 0.1;
            const computed = Math.round(width * height * fps * targetBpppf);
            videoBitrate = Math.min(Math.max(computed, 8_000_000), 25_000_000);
            console.log("Dynamic bitrate (bps):", videoBitrate, {
                width,
                height,
                fps,
            });
            console.log("Final recording settings:", {
                mimeType,
                videoBitrate: `${videoBitrate / 1000000} Mbps`,
                audioBitrate: "192 kbps",
                dataCollectionInterval: "500ms - REDUCED FOR SMOOTH CURSOR",
            });
            const mediaRecorder = new MediaRecorder(streamRef.current, {
                mimeType,
                videoBitsPerSecond: videoBitrate,
                audioBitsPerSecond: 192000,
            });
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = async (event) => {
                const { error } = await tryCatch(async () => {
                    if (!event.data || event.data.size <= 0)
                        return;
                    if (!streamingEnabledRef.current || !filePathRef.current) {
                        chunksRef.current.push(event.data);
                        return;
                    }
                    const doWrite = async () => {
                        const ab = await event.data.arrayBuffer();
                        const uint8 = new Uint8Array(ab);
                        await electronAPI.writeRecordingChunk(filePathRef.current, uint8);
                    };
                    writeQueueRef.current = writeQueueRef.current
                        .then(doWrite)
                        .catch((err) => console.error("Streaming write error:", err));
                });
                if (error) {
                    console.error("Chunk handling error:", error);
                }
            };
            mediaRecorder.onerror = async (event) => {
                console.error("MediaRecorder error:", event);
                setIsRecording(false);
                setRecordingTime(0);
                cleanupStreams();
                overlay.dispose();
                compositor.dispose();
                const { error: cleanupErr } = await tryCatch(async () => {
                    if (!streamingEnabledRef.current || !filePathRef.current)
                        return;
                    await writeQueueRef.current;
                    await electronAPI.closeRecordingStream(filePathRef.current);
                    await electronAPI.deletePartialRecording(filePathRef.current);
                });
                if (cleanupErr) {
                    console.warn("Cleanup after error failed:", cleanupErr);
                }
                streamingEnabledRef.current = false;
                // Re-enable capturing of our app windows after failure
                await electronAPI.setExcludeAppWindowsFromCapture(false);
                alert("Recording error occurred. This may be due to capture issues.");
            };
            mediaRecorder.onstop = async () => {
                try {
                    if (streamingEnabledRef.current && filePathRef.current) {
                        await writeQueueRef.current;
                        const finalPath = await electronAPI.finalizeRecordingStream(filePathRef.current);
                        alert(`Recording saved: ${finalPath}`);
                        if (electronAPI.openFolder) {
                            electronAPI.openFolder(finalPath);
                        }
                    }
                    else {
                        const blob = new Blob(chunksRef.current, { type: mimeType });
                        chunksRef.current = [];
                        const arrayBuffer = await blob.arrayBuffer();
                        const uint8 = new Uint8Array(arrayBuffer);
                        const msg = await electronAPI.saveRecording(recordingConfig.filePath, uint8);
                        console.log(msg);
                        alert(`Recording saved: ${recordingConfig.filePath}`);
                        if (electronAPI.openFolder) {
                            electronAPI.openFolder(recordingConfig.filePath);
                        }
                    }
                }
                catch (err) {
                    console.error("Save recording error:", err);
                    alert(`Failed to save recording: ${err}`);
                }
                finally {
                    overlay.dispose();
                    compositor.dispose();
                    // Re-open the camera overlay window if we closed it for recording
                    if (closedCameraForRecordingRef.current && selectedCameraId) {
                        await electronAPI.openCamera(selectedCameraId);
                    }
                    closedCameraForRecordingRef.current = false;
                    setIsRecording(false);
                    setIsPaused(false);
                    setRecordingTime(0);
                    onClose();
                    streamingEnabledRef.current = false;
                    filePathRef.current = null;
                    // Restore normal capture behavior for our windows
                    await electronAPI.setExcludeAppWindowsFromCapture(false);
                }
            };
            console.log("=== RECORDING START DIAGNOSTICS ===");
            console.log("MediaRecorder state:", mediaRecorder.state);
            console.log("Stream tracks:", streamRef.current?.getTracks().map((track) => ({
                kind: track.kind,
                label: track.label,
                enabled: track.enabled,
                readyState: track.readyState,
                settings: track.getSettings ? track.getSettings() : "N/A",
            })));
            mediaRecorder.start(500);
            setIsRecording(true);
            setRecordingTime(0);
            setIsStartingRecording(false);
            console.log(`�o. Recording started for: ${source.name}`);
            console.log("�o. OPTIMIZED: Using 500ms data collection interval for smooth cursor!");
        }
        catch (error) {
            console.error("Error starting recording:", error);
            setIsStartingRecording(false);
            // Ensure we don't leave the app windows excluded in case of failure
            await electronAPI.setExcludeAppWindowsFromCapture(false);
            alert(`�?O Failed to start recording: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        else if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            try {
                mediaRecorderRef.current.stop();
            }
            catch { }
        }
        cleanupStreams();
    };
    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            try {
                mediaRecorderRef.current.pause();
                setIsPaused(true);
            }
            catch (e) {
                console.warn("Pause failed or unsupported:", e);
            }
        }
    };
    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            try {
                mediaRecorderRef.current.resume();
                setIsPaused(false);
            }
            catch (e) {
                console.warn("Resume failed or unsupported:", e);
            }
        }
    };
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    if (!isVisible)
        return null;
    return (_jsx("main", { className: "grid size-max gap-4 overflow-hidden p-2", children: _jsxs("section", { className: "bg-background shadow-cursor flex items-center overflow-x-hidden rounded-2xl py-3 pr-4 pl-3", style: { WebkitAppRegion: "drag" }, children: [_jsx("div", { className: "grid shrink-0 place-items-center gap-2 rounded-md py-0.5 text-left text-sm font-medium whitespace-nowrap text-red-600", children: formatTime(recordingTime || 0) }), _jsx("div", { className: "mx-4 h-3/4 border-r" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { style: { WebkitAppRegion: "no-drag" }, onPress: () => stopRecording(), children: _jsx(StopIcon, { className: "size-5 text-red-600" }) }), !isRecording || isPaused ? (_jsx(Button, { onPress: resumeRecording, style: { WebkitAppRegion: "no-drag" }, children: _jsx(PlayIcon, { className: "size-5" }) })) : (_jsx(Button, { onPress: pauseRecording, style: { WebkitAppRegion: "no-drag" }, children: _jsx(PauseIcon, { className: "size-5" }) }))] }), _jsx("div", { className: "mx-4 h-3/4 border-r" }), _jsx(Button, { style: { WebkitAppRegion: "no-drag" }, children: _jsx(DeleteIcon, { className: "size-5" }) })] }) }));
}
const RecordBar = () => {
    const { config, isLoading } = useRecordConfig();
    const handleClose = () => {
        electronAPI.closeRecordBar();
        electronAPI.closeCamera();
    };
    if (!config || isLoading) {
        return (_jsx("div", { className: "flex h-full w-full items-center justify-center bg-transparent", children: _jsx("div", { className: "text-sm text-white", children: "Waiting for source selection..." }) }));
    }
    return (_jsx("div", { className: "flex h-full w-full items-center justify-center bg-transparent", children: _jsx(FloatingBar, { source: config.source, selectedMicId: config.selectedMicId, selectedCameraId: config.selectedCameraId, isSystemSoundEnabled: config.isSystemSoundEnabled, isVisible: !isLoading, onClose: handleClose }) }));
};
const root = createRoot(document.getElementById("root"));
root.render(_jsx(RecordBar, {}));
//# sourceMappingURL=record-bar.js.map