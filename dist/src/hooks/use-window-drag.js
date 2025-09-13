import { useEffect, useRef } from "react";
function useWindowDrag() {
    const containerRef = useRef(null);
    const draggingRef = useRef(false);
    const dragOffsetRef = useRef(null);
    useEffect(() => {
        const el = containerRef.current;
        if (!el)
            return;
        const onMouseDown = async (e) => {
            const target = e.target;
            if (target && target.closest('[data-no-drag="true"]'))
                return;
            if (e.button !== 0)
                return;
            e.preventDefault();
            try {
                const bounds = await window.electronAPI.getCurrentWindowBounds?.();
                if (!bounds)
                    return;
                // Use mouse screen position from the event to minimize IPC
                const offsetX = e.screenX - bounds.x;
                const offsetY = e.screenY - bounds.y;
                dragOffsetRef.current = { x: offsetX, y: offsetY };
                draggingRef.current = true;
                const prevUserSelect = document.body.style.userSelect;
                const prevCursor = document.body.style.cursor;
                document.body.style.userSelect = "none";
                document.body.style.cursor = "grabbing";
                const onMove = (ev) => {
                    if (!draggingRef.current || !dragOffsetRef.current)
                        return;
                    const nx = ev.screenX - dragOffsetRef.current.x;
                    const ny = ev.screenY - dragOffsetRef.current.y;
                    window.electronAPI.setCurrentWindowPosition?.(nx, ny);
                };
                const onUp = () => {
                    draggingRef.current = false;
                    dragOffsetRef.current = null;
                    document.body.style.userSelect = prevUserSelect;
                    document.body.style.cursor = prevCursor;
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
            }
            catch {
                // ignore
            }
        };
        el.addEventListener("mousedown", onMouseDown);
        return () => {
            el.removeEventListener("mousedown", onMouseDown);
        };
    }, []);
    return { containerRef };
}
export default useWindowDrag;
//# sourceMappingURL=use-window-drag.js.map