import { createRoot } from "react-dom/client"

import HomePage from "./app/page"

const App = () => {
    return <HomePage />
}

const root = createRoot(document.body)
root.render(<App />)
