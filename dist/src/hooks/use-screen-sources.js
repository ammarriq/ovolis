import { useEffect, useState } from "react";
function useScreenSources() {
    const [screenSources, setScreenSources] = useState([]);
    useEffect(() => {
        const getScreenSources = async () => {
            try {
                const sources = await window.electronAPI.getScreenSources();
                setScreenSources(sources);
            }
            catch (error) {
                console.error("Failed to get screen sources:", error);
                alert("Failed to get screen sources. Make sure you are running in Electron.");
            }
        };
        getScreenSources();
        window.addEventListener("focus", getScreenSources);
        return () => {
            window.removeEventListener("focus", getScreenSources);
        };
    }, []);
    return screenSources;
}
export default useScreenSources;
//# sourceMappingURL=use-screen-sources.js.map