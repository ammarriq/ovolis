import type { SwitchProps } from "react-aria-components"

import { Switch as _Switch } from "react-aria-components"

import { cn } from "~/utils/cn"

export function Switch({ className, children, ...props }: SwitchProps) {
    return (
        <_Switch {...props} className={cn("group text-sm", className)}>
            {children ? (
                children
            ) : (
                <SwitchTrack>
                    <SwitchThumb />
                </SwitchTrack>
            )}
        </_Switch>
    )
}

export function SwitchTrack({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <span
            {...props}
            className={cn(
                "group-data-[selected=true]:bg-primary ml-auto block h-4.5 w-8 max-w-8 rounded-full bg-white p-0.5 transition-all",
                className,
            )}
        >
            {children}
        </span>
    )
}

export function SwitchThumb({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <span
            {...props}
            className={cn(
                "block aspect-square h-full rounded-full bg-[#F3F4F6] transition-transform group-data-[selected=true]:translate-x-full",
                className,
            )}
        ></span>
    )
}
