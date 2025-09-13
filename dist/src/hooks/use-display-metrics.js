import { useEffect, useState } from "react";
function useDisplayMetrics({ selectedSource }) {
    const [displayMetrics, setDisplayMetrics] = useState(null);
    useEffect(() => {
        const getDisplayMetrics = async () => {
            if (!selectedSource)
                return;
            try {
                const metrics = await window.electronAPI.getDisplayMetrics(selectedSource.displayId);
                setDisplayMetrics({ width: metrics.width, height: metrics.height });
            }
            catch (error) {
                console.error(error);
                setDisplayMetrics(null);
            }
        };
        getDisplayMetrics();
    }, [selectedSource]);
    return displayMetrics;
}
export default useDisplayMetrics;
//# sourceMappingURL=use-display-metrics.js.map