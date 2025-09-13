import { useEffect, useState } from "react";
function useDevices() {
    const [mics, setMics] = useState([]);
    const [cameras, setCameras] = useState([]);
    useEffect(() => {
        const pickPreferredPerGroup = (list) => {
            const groups = new Map();
            for (const d of list) {
                const key = d.groupId || d.deviceId;
                const arr = groups.get(key) ?? [];
                arr.push(d);
                groups.set(key, arr);
            }
            const result = [];
            for (const arr of groups.values()) {
                const preferred = arr.find((d) => d.deviceId !== "default" && d.deviceId !== "communications") ??
                    arr[0];
                result.push(preferred);
            }
            return result;
        };
        const refreshDevices = async () => {
            try {
                const all = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = all.filter((d) => d.kind === "audioinput");
                const videoInputs = all.filter((d) => d.kind === "videoinput");
                const uniqueMics = pickPreferredPerGroup(audioInputs);
                const uniqueCameras = pickPreferredPerGroup(videoInputs);
                setMics(uniqueMics);
                setCameras(uniqueCameras);
            }
            catch (error) {
                console.error(error);
            }
        };
        refreshDevices();
        navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
        return () => {
            navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
        };
    }, []);
    return { mics, cameras };
}
export default useDevices;
//# sourceMappingURL=use-devices.js.map