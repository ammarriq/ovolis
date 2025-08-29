import type { SVGProps } from "react"

export function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth={2}
            {...props}
        >
            <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12 19l-7-7l7-7m7 7H5"
            ></path>
        </svg>
    )
}
