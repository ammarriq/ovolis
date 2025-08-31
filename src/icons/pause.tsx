import type { SVGProps } from "react"

export function PauseIcon(props: SVGProps<SVGSVGElement>) {
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
                <circle cx={12} cy={12} r={10}></circle>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9v6m5-6v6"></path>
            </g>
        </svg>
    )
}
