import { useEffect, useMemo, useRef } from "react";
function useLiveVideo({ screenId, cameraId, disabled = false }) {
    const videoRef = useRef(null);
    const constraints = useMemo(() => {
        if (disabled)
            return;
        if (!cameraId && !screenId)
            return;
        if (screenId) {
            return {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: screenId,
                    },
                },
            };
        }
        return {
            audio: false,
            video: { deviceId: { exact: cameraId } },
        };
    }, [cameraId, screenId, disabled]);
    useEffect(() => {
        if (!constraints)
            return;
        let stopped = false;
        let localStream = null;
        const videoEl = videoRef.current;
        const startPreview = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (stopped) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                localStream = stream;
                if (videoEl) {
                    videoEl.srcObject = stream;
                    try {
                        await videoEl.play();
                    }
                    catch {
                        /* ignore */
                    }
                }
            }
            catch (err) {
                console.error("Failed to start live preview:", err);
            }
        };
        startPreview();
        return () => {
            stopped = true;
            if (videoEl) {
                try {
                    videoEl.pause();
                }
                catch { }
                videoEl.srcObject = null;
            }
            if (localStream) {
                localStream.getTracks().forEach((t) => t.stop());
            }
        };
    }, [constraints]);
    return { videoRef };
}
export default useLiveVideo;
//# sourceMappingURL=use-live-video.js.map