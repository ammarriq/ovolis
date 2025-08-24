import React from "react"
import type { SVGProps } from "react"

export function CropScreenIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            {...props}
        >
            <g fill="none" stroke="currentColor" strokeLinecap="round">
                <path strokeLinejoin="round" d="M5 2v6M2 5h6"></path>
                <path d="M12 5h3m-3 17h3m3-17h.5A3.5 3.5 0 0 1 22 8.5V9m0 9v.5a3.5 3.5 0 0 1-3.5 3.5H18m-9 0h-.5A3.5 3.5 0 0 1 5 18.5V18m17-6v3M5 12v3"></path>
            </g>
        </svg>
    )
}
