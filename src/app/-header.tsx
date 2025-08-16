import { CloseIcon } from "~/icons/close"
import { MaximizeIcon } from "~/icons/maximize"
import { MinimizeIcon } from "~/icons/minimize"

function Header() {
    return (
        <header
            className="flex items-center border-b h-10 overflow-hidden"
            style={{ WebkitAppRegion: "drag" }}
        >
            <div className="text-xs font-medium px-3">Recrod</div>
            <div className="w-16"></div> {/* Spacer for centering */}
            <div className="flex items-center ml-auto absolute top-0 right-0">
                <button
                    className="h-10 w-11 grid place-items-center hover:bg-muted"
                    onClick={() => window.electronAPI?.minimizeWindow()}
                    style={{ WebkitAppRegion: "no-drag" }}
                >
                    <MinimizeIcon className="size-4 mt-0.5" />
                </button>
                <button
                    className="h-10 w-11 grid place-items-center hover:bg-muted"
                    onClick={() => window.electronAPI?.maximizeWindow()}
                    style={{ WebkitAppRegion: "no-drag" }}
                >
                    <MaximizeIcon className="size-4" />
                </button>
                <button
                    className="h-10 w-11 grid place-items-center hover:bg-destructive hover:text-destructive-foreground"
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
