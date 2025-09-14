import type {
    ButtonProps,
    DialogProps,
    DialogTriggerProps,
    PopoverProps,
} from "react-aria-components"

import { Button, Dialog, DialogTrigger, Popover as _Popover } from "react-aria-components"

import { cn } from "~/utils/cn"

export function Popover(props: DialogTriggerProps) {
    return <DialogTrigger {...props}></DialogTrigger>
}

export function PopoverTrigger({ className, ...props }: ButtonProps) {
    return (
        <Button
            className={cn(
                "z-10 flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm disabled:opacity-60",
                className,
            )}
            {...props}
        ></Button>
    )
}

export function PopoverContent({
    className,
    placement,
    ...props
}: DialogProps & { placement?: PopoverProps["placement"] }) {
    return (
        <_Popover className="outline-none" placement={placement}>
            <Dialog
                {...props}
                className={cn(
                    "bg-background shadow-cursor w-[var(--trigger-width)] rounded-md p-1 text-sm outline-none",
                    className,
                )}
            ></Dialog>
        </_Popover>
    )
}
