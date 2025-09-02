import { useCallback, useRef, useState } from "react"

function useSyncedState<T>(initialValue: T) {
    const [state, setState] = useState(initialValue)
    const ref = useRef(state)

    const setSyncedState = useCallback((value: T | ((prev: T) => T)) => {
        ref.current = typeof value === "function" ? (value as (prev: T) => T)(ref.current) : value
        setState(ref.current)
    }, [])

    return [state, setSyncedState, ref] as const
}

export default useSyncedState
