import { useState } from "react"
import { createRoot } from "react-dom/client"

import RecordBar from "./record-bar"
import Recorder from "./recorder"

const App = () => {
    const [isRecording, setIsRecording] = useState(false)

    const onRecordingStart = () => {
        setIsRecording(true)
        window.electronAPI.startRecording()
    }

    const onRecordingStop = () => {
        window.electronAPI.stopRecording()
        setIsRecording(false)
    }

    return isRecording ? (
        <RecordBar onStop={onRecordingStop} />
    ) : (
        <Recorder onRecord={onRecordingStart} />
    )
}

const root = createRoot(document.body)
root.render(<App />)
