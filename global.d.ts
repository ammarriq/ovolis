// Declare electron API types
declare global {
    interface Window {
        electronAPI: {
            minimizeWindow: () => Promise<void>
            maximizeWindow: () => Promise<void>
            closeWindow: () => Promise<void>
        }
    }
}

// Global React JSX style attribute enhancement
declare module "react" {
    interface CSSProperties {
        WebkitAppRegion?: "drag" | "no-drag"
    }
}

export {}
