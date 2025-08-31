import { useState } from "react"
import { createRoot } from "react-dom/client"

import RecordBar from "./record-bar"
import Recorder from "./recorder"

const App = () => {
    const [isRecording, setIsRecording] = useState(false)

    return isRecording ? (
        <RecordBar onStop={() => setIsRecording(false)} />
    ) : (
        <Recorder onRecord={() => setIsRecording(true)} />
    )
}

const root = createRoot(document.body)
root.render(<App />)
