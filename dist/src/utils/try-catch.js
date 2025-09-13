export async function tryCatch(promise) {
    try {
        const data = await (promise instanceof Function ? promise() : promise);
        return { data, error: null };
    }
    catch (error) {
        return { data: null, error: error };
    }
}
export function tryCatchSync(stmt) {
    try {
        const data = stmt instanceof Function ? stmt() : stmt;
        return { data, error: null };
    }
    catch (error) {
        return { data: null, error: error };
    }
}
//# sourceMappingURL=try-catch.js.map