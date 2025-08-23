import type { SVGProps } from "react"

export function DragIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={20}
            height={20}
            viewBox="0 0 20 20"
            {...props}
        >
            <path
                fill="currentColor"
                d="M7.25 8.75a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m7-1.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m-7 7a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m7-1.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0"
            ></path>
        </svg>
    )
}
