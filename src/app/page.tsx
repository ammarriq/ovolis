import type { ScreenSource } from "~/types/screen-sources"

import { useEffect, useState } from "react"

import Header from "./-header"

const HomePage = () => {
    const [modal, setModal] = useState(false)
    const [screenSources, setScreenSources] = useState<ScreenSource[]>([])

    useEffect(() => {
        // Check if electronAPI is available
        if (window.electronAPI) {
            window.electronAPI.getScreenSources().then((sources) => {
                setScreenSources(sources)
            })

            window.onfocus = () => {
                window.electronAPI.getScreenSources().then((sources) => {
                    setScreenSources(sources)
                })
            }
        } else {
            console.warn('electronAPI not available - running in browser mode')
        }
    }, [])

    const getScreenSources = async () => {
        setModal(true)

        if (window.electronAPI) {
            const sources = await window.electronAPI.getScreenSources()
            setScreenSources(sources)
        } else {
            console.warn('electronAPI not available')
        }
    }

    return (
        <div className="w-full h-screen bg-background shadow-lg flex flex-col border">
            <Header />

            <div className="p-4 mt-10 overflow-y-auto">
                {modal ? (
                    <div className="flex gap-4 justify-center flex-wrap">
                        {screenSources.map((source) => (
                            <button
                                key={source.id}
                                className="w-80 overflow-hidden gap-4 justify-between border flex flex-col hover:bg-accent p-2 rounded-md"
                                onClick={() => {
                                    if (window.electronAPI) {
                                        window.electronAPI
                                            .resizeWindow({
                                                appName: source.name,
                                                width: 1200,
                                                height: 800,
                                            })
                                            .then((result) => {
                                                console.log('Resize success:', result)
                                                // Optionally show success feedback to user
                                        })
                                        .catch((error) => {
                                            console.error('Resize failed:', error)
                                            // Optionally show error feedback to user
                                            alert(`Failed to resize window: ${error}`)
                                        })
                                    } else {
                                        console.warn('electronAPI not available')
                                        alert('Resize functionality not available in browser mode')
                                    }
                                }}
                            >
                                <img
                                    src={source.thumbnail}
                                    className="rounded-sm"
                                    alt={source.name}
                                />
                                <p className="truncate text-sm">
                                    {source.name}
                                </p>
                            </button>
                        ))}
                        <button onClick={() => setModal(false)}>Close</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center p-4 grow justify-center overflow-y-auto gap-4">
                        <button
                            onClick={() => getScreenSources()}
                            className="cursor-pointer size-24 rounded-full bg-primary grid place-items-center text-foreground-primary font-bold"
                        >
                            Record
                        </button>
                        
                        <div className="flex flex-col gap-2 items-center">
                             <p className="text-sm text-gray-600">External Window Resize Test</p>
                             <div className="flex gap-2">
                                 <button
                                     onClick={() => {
                                         if (window.electronAPI) {
                                             window.electronAPI
                                                 .resizeWindow({
                                                     appName: "Notepad",
                                                     width: 1000,
                                                     height: 700,
                                                 })
                                                 .then((result) => {
                                                     console.log('Resize success:', result)
                                                     alert(result)
                                                 })
                                                 .catch((error) => {
                                                     console.error('Resize failed:', error)
                                                     alert(`Error: ${error}`)
                                                 })
                                         }
                                     }}
                                     className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                 >
                                     Resize Notepad
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         if (window.electronAPI) {
                                             window.electronAPI
                                                 .resizeWindow({
                                                     appName: "Chrome",
                                                     width: 800,
                                                     height: 600,
                                                 })
                                                 .then((result) => {
                                                     console.log('Resize success:', result)
                                                     alert(result)
                                                 })
                                                 .catch((error) => {
                                                     console.error('Resize failed:', error)
                                                     alert(`Error: ${error}`)
                                                 })
                                         }
                                     }}
                                     className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                 >
                                     Resize Chrome
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         if (window.electronAPI) {
                                             window.electronAPI
                                                 .resizeWindow({
                                                     appName: "Calculator",
                                                     width: 400,
                                                     height: 500,
                                                 })
                                                 .then((result) => {
                                                     console.log('Resize success:', result)
                                                     alert(result)
                                                 })
                                                 .catch((error) => {
                                                     console.error('Resize failed:', error)
                                                     alert(`Error: ${error}`)
                                                 })
                                         }
                                     }}
                                     className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                                 >
                                     Resize Calculator
                                 </button>
                             </div>
                         </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HomePage
