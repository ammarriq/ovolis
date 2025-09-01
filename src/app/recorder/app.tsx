import "@fontsource-variable/noto-sans-lao"

import type { ScreenSource } from "~/types/screen-sources"

import { createRoot } from "react-dom/client"

import Recorder from "./recorder"

const App = () => {
    const onRecordingStart = (source: ScreenSource) => {
        window.electronAPI.createRecordBar(source)
    }

    return <Recorder onRecord={onRecordingStart} />
}

const root = createRoot(document.body)
root.render(<App />)
