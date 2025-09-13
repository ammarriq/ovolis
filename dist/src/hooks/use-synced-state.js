import { useCallback, useRef, useState } from "react";
function useSyncedState(initialValue) {
    const [state, setState] = useState(initialValue);
    const ref = useRef(state);
    const setSyncedState = useCallback((value) => {
        ref.current = typeof value === "function" ? value(ref.current) : value;
        setState(ref.current);
    }, []);
    return [state, setSyncedState, ref];
}
export default useSyncedState;
//# sourceMappingURL=use-synced-state.js.map