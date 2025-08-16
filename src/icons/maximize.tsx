import type { SVGProps } from "react"

export function MaximizeIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={16}
            height={16}
            viewBox="0 0 16 16"
            strokeWidth={1}
            {...props}
        >
            <path
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                d="M3.5 4.5h9v7h-9z"
            ></path>
        </svg>
    )
}
