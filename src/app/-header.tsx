import { CloseIcon } from "~/icons/close"
import { MaximizeIcon } from "~/icons/maximize"
import { MinimizeIcon } from "~/icons/minimize"

function Header() {
    return (
        <header
            className="bg-background fixed top-0 flex h-10 w-full items-center overflow-hidden border-b"
            style={{ WebkitAppRegion: "drag" }}
        >
            <div className="px-3 text-xs font-medium">CursorX</div>
            <div className="w-16"></div> {/* Spacer for centering */}
            <div className="absolute top-0 right-0 ml-auto flex items-center">
                <button
                    className="hover:bg-muted grid h-10 w-11 place-items-center"
                    onClick={() => window.electronAPI?.minimizeWindow()}
                    style={{ WebkitAppRegion: "no-drag" }}
                >
                    <MinimizeIcon className="mt-0.5 size-4" />
                </button>
                <button
                    className="hover:bg-muted grid h-10 w-11 place-items-center"
                    onClick={() => window.electronAPI?.maximizeWindow()}
                    style={{ WebkitAppRegion: "no-drag" }}
                >
                    <MaximizeIcon className="size-4" />
                </button>
                <button
                    className="hover:bg-destructive hover:text-destructive-foreground grid h-10 w-11 place-items-center"
                    onClick={() => window.electronAPI?.closeWindow()}
                    style={{ WebkitAppRegion: "no-drag" }}
                >
                    <CloseIcon className="size-4.75" />
                </button>
            </div>
        </header>
    )
}

export default Header
