import { useEffect, useState } from "react";
function useRecordConfig() {
    const [config, setConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const handler = (event) => {
            setConfig(event.detail.config);
            setIsLoading(false);
        };
        window.addEventListener("record-config", handler);
        return () => {
            window.removeEventListener("record-config", handler);
        };
    }, []);
    return { config, isLoading };
}
export default useRecordConfig;
//# sourceMappingURL=use-record-config.js.map