import "@fontsource-variable/noto-sans-lao"

import type { RecordConfig } from "~/types/record-config"

import { createRoot } from "react-dom/client"

import Recorder from "./recorder"

const App = () => {
    const onRecordingStart = (config: RecordConfig) => {
        window.electronAPI.createRecordBar(config)
    }

    return <Recorder onRecord={onRecordingStart} />
}

const root = createRoot(document.body)
root.render(<App />)
