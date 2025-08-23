import type { SVGProps } from "react"

export function CameraIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            {...props}
        >
            <g fill="none" stroke="currentColor">
                <path strokeLinecap="round" d="M11 8h2"></path>
                <path d="M2 11c0-3.3 0-4.95 1.025-5.975S5.7 4 9 4h1c3.3 0 4.95 0 5.975 1.025S17 7.7 17 11v2c0 3.3 0 4.95-1.025 5.975S13.3 20 10 20H9c-3.3 0-4.95 0-5.975-1.025S2 16.3 2 13z"></path>
                <path
                    strokeLinecap="round"
                    d="m17 8.906l.126-.104c2.116-1.746 3.174-2.619 4.024-2.197c.85.421.85 1.819.85 4.613v1.564c0 2.794 0 4.192-.85 4.613s-1.908-.451-4.024-2.197L17 15.094"
                ></path>
            </g>
        </svg>
    )
}
