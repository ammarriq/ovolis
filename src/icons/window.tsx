import type { SVGProps } from "react"

export function WindowIcon({ strokeWidth = 1.5, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth={strokeWidth}
            {...props}
        >
            <g fill="none" stroke="currentColor">
                <path d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12Z"></path>
                <path strokeLinejoin="round" d="M2.5 9h19"></path>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={+strokeWidth + 0.5}
                    d="M7 6h.009M11 6h.009"
                ></path>
            </g>
        </svg>
    )
}
