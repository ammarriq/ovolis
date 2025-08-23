import type { SVGProps } from "react"

export function MicIcon(props: SVGProps<SVGSVGElement>) {
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
                <path d="M17 7v4a5 5 0 0 1-10 0V7a5 5 0 0 1 10 0Z"></path>
                <path
                    strokeLinecap="round"
                    d="M17 7h-3m3 4h-3m6 0a8 8 0 0 1-8 8m0 0a8 8 0 0 1-8-8m8 8v3m0 0h3m-3 0H9"
                ></path>
            </g>
        </svg>
    )
}
