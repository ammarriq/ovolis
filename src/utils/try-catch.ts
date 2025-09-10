type Success<T> = {
    data: T
    error: null
}

type Failure<E> = {
    data: null
    error: E
}

type Result<T, E = Error> = Success<T> | Failure<E>

export async function tryCatch<T, E = Error>(
    promise: Promise<T> | (() => Promise<T>),
): Promise<Result<T, E>> {
    try {
        const data = await (promise instanceof Function ? promise() : promise)
        return { data, error: null }
    } catch (error) {
        return { data: null, error: error as E }
    }
}

export function tryCatchSync<T, E = Error>(stmt: T | (() => T)): Result<T, E> {
    try {
        const data = stmt instanceof Function ? stmt() : stmt
        return { data, error: null }
    } catch (error) {
        return { data: null, error: error as E }
    }
}
