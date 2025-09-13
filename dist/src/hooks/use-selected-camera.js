import { useEffect, useState } from "react";
function useSelectedCamera() {
    const [cameraId, setCameraId] = useState(null);
    useEffect(() => {
        const handleCameraSelected = (event) => {
            setCameraId(event.detail.cameraId);
        };
        window.addEventListener("camera-selected", handleCameraSelected);
        return () => {
            window.removeEventListener("camera-selected", handleCameraSelected);
        };
    }, []);
    return cameraId;
}
export default useSelectedCamera;
//# sourceMappingURL=use-selected-camera.js.map