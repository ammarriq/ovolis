import type { SVGProps } from "react"

export function CustomScreenIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            {...props}
        >
            {/* Top-left corner with rounded radius */}
            <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.5 3c-1.396 0-2.093 0-2.661.172A4 4 0 0 0 3.172 5.84C3 6.407 3 7.104 3 8.5"
            />
            {/* Top-right corner with rounded radius */}
            <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.5 3c1.396 0 2.093 0 2.661.172a4 4 0 0 1 2.667 2.667C21 6.407 21 7.104 21 8.5"
            />
            {/* Bottom-left corner with rounded radius */}
            <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 15.5c0 1.396 0 2.093.172 2.661a4 4 0 0 0 2.667 2.667C6.407 21 7.104 21 8.5 21"
            />
            {/* Bottom-right plus sign (replaces corner lines) */}
            <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 18H20M18 16V20"
            />
        </svg>
    )
}
