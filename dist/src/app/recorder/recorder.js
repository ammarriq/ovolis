import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "@fontsource-variable/noto-sans-lao";
import "~/index.css";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "react-aria-components";
import AppIcon from "~/assets/icons/icon.png";
import Screens from "~/components/screens";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "~/components/ui/select";
import Switch from "~/components/ui/switch";
import useDevices from "~/hooks/use-devices";
import useDevicesReady from "~/hooks/use-devices-ready";
import useDisplayMetrics from "~/hooks/use-display-metrics";
import useScreenSources from "~/hooks/use-screen-sources";
import { CameraIcon } from "~/icons/camera";
import { CloseIcon } from "~/icons/close";
import { MicIcon } from "~/icons/mic";
import { ScreenIcon } from "~/icons/screen";
import { VolumeIcon } from "~/icons/volume";
function Recorder() {
    const [modal, setModal] = useState(false);
    const [selectedSource, setSelectedSource] = useState();
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const [selectedMicId, setSelectedMicId] = useState(null);
    const [isSystemSoundEnabled, setIsSystemSoundEnabled] = useState(true);
    const { mics, cameras } = useDevices();
    const areDevicesReady = useDevicesReady();
    const screenSources = useScreenSources();
    const displayMetrics = useDisplayMetrics({ selectedSource });
    useEffect(() => {
        if (!selectedSource && screenSources.length > 0) {
            const entireScreen = screenSources.find((s) => s.id?.startsWith("screen:")) ||
                screenSources.find((s) => /entire\s*screen/i.test(s.name)) ||
                screenSources[0];
            setSelectedSource(entireScreen);
        }
    }, [screenSources, selectedSource]);
    const didInitMicRef = useRef(false);
    useEffect(() => {
        if (!didInitMicRef.current && mics.length > 0) {
            setSelectedMicId((prev) => (prev === null ? mics[0].deviceId : prev));
            didInitMicRef.current = true;
        }
    }, [mics]);
    const toggleScreenSelection = () => {
        if (modal) {
            setModal(false);
            window.electronAPI.setWindowSize();
        }
        else {
            setModal(true);
            window.electronAPI.setWindowSize(420 + 280);
        }
    };
    if (!areDevicesReady)
        return null;
    return (_jsxs("main", { className: "grid h-screen grid-cols-[266px_400px] gap-4 overflow-hidden p-2", children: [_jsxs("section", { className: "bg-background shadow-cursor flex flex-col overflow-x-hidden rounded-2xl", children: [_jsxs("header", { style: { WebkitAppRegion: "drag" }, className: "bg-background mb-2.5 flex w-full items-center justify-between gap-4 px-4 pt-2", children: [_jsx("div", { className: "size-5 shrink-0", style: { backgroundImage: `url(${AppIcon})`, backgroundSize: "cover" } }), _jsx("button", { className: "relative -mr-2 grid size-7 shrink-0 place-items-center rounded-full", style: { WebkitAppRegion: "no-drag" }, onClick: () => window.electronAPI?.closeWindow(), children: _jsx(CloseIcon, { strokeWidth: 2, className: "size-4" }) })] }), _jsxs("aside", { className: "bg-background grow px-4 pb-4", children: [_jsxs("fieldset", { className: "space-y-2", children: [_jsx("h3", { className: "mb-2 text-xs font-bold", children: "Record Option" }), _jsxs(Button, { className: "flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm whitespace-nowrap", onPress: toggleScreenSelection, children: [_jsx(ScreenIcon, { className: "text-primary size-4.5" }), _jsx("p", { className: "w-0 grow truncate", children: selectedSource?.name ?? "Entire Screen" })] })] }), _jsxs("fieldset", { className: "mt-4 space-y-2", children: [_jsx("h3", { className: "mb-2 text-xs font-bold", children: "Record Settings" }), _jsxs(Select, { "aria-label": "Select Camera", placeholder: "Camera", selectedKey: selectedCameraId ?? "none", onSelectionChange: (key) => {
                                            const camera = key !== "none" ? String(key) : null;
                                            setSelectedCameraId(camera);
                                            if (camera) {
                                                window.electronAPI.openCamera(camera);
                                            }
                                            else {
                                                window.electronAPI.closeCamera();
                                            }
                                        }, children: [_jsxs(SelectTrigger, { className: "py-1.5", children: [_jsx(CameraIcon, { className: "text-primary size-4.5" }), _jsx(SelectValue, {}), _jsx(Switch, { isOn: selectedCameraId !== null })] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { id: "none", children: "No Camera" }), cameras.map((c, idx) => (_jsx(SelectItem, { id: c.deviceId, "aria-label": c.label || `Camera ${idx + 1}`, children: c.label || `Camera ${idx + 1}` }, c.deviceId)))] })] }), _jsxs(Select, { "aria-label": "Select Microphone", placeholder: "Microphone", selectedKey: selectedMicId ?? "none", onSelectionChange: (key) => {
                                            const mic = key !== "none" ? String(key) : null;
                                            setSelectedMicId(mic);
                                        }, children: [_jsxs(SelectTrigger, { className: "py-1.5", children: [_jsx(MicIcon, { className: "text-primary size-4.5" }), _jsx(SelectValue, {}), _jsx(Switch, { isOn: selectedMicId !== null })] }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { id: "none", children: "No Microphone" }), mics.map((m, idx) => (_jsx(SelectItem, { id: m.deviceId, children: m.label || `Microphone ${idx + 1}` }, m.deviceId)))] })] }), _jsxs(Button, { className: "z-10 flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-1.5 text-left text-sm whitespace-nowrap disabled:opacity-60 [&>span]:w-0 [&>span]:grow [&>span]:truncate [&>svg]:size-4.5 [&>svg]:shrink-0", onPress: () => setIsSystemSoundEnabled(!isSystemSoundEnabled), children: [_jsx(VolumeIcon, { className: "text-primary size-4.5" }), _jsx("p", { children: "System Sound" }), _jsx(Switch, { isOn: isSystemSoundEnabled })] })] }), _jsx(Button, { className: "bg-primary text-primary-foreground mt-4 w-full rounded-md px-3 py-2 text-sm", onPress: () => {
                                    if (selectedSource) {
                                        window.electronAPI.createRecordBar({
                                            source: selectedSource,
                                            selectedMicId,
                                            selectedCameraId,
                                            isSystemSoundEnabled,
                                        });
                                    }
                                }, children: "Start Recording" })] })] }), modal ? (_jsx(Screens, { displayMetrics: displayMetrics, screenSources: screenSources, selectedScreen: selectedSource, onScreenSelected: setSelectedSource, onClose: toggleScreenSelection })) : null] }));
}
const root = createRoot(document.body);
root.render(_jsx(Recorder, {}));
//# sourceMappingURL=recorder.js.map