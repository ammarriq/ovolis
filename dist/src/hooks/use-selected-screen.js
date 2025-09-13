import { useEffect, useState } from "react";
function useSelectedScreen() {
    const [source, setSource] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const handleSourceSelected = (event) => {
            const data = event.detail;
            setSource(data.source);
            setIsLoading(false);
        };
        window.addEventListener("source-selected", handleSourceSelected);
        return () => {
            window.removeEventListener("source-selected", handleSourceSelected);
        };
    }, []);
    return { source, isLoading };
}
export default useSelectedScreen;
//# sourceMappingURL=use-selected-screen.js.map