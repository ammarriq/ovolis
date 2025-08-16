import type { SVGProps } from "react"

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
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
                d="m4.5 4.5l7 7m0-7l-7 7"
            ></path>
        </svg>
    )
}
