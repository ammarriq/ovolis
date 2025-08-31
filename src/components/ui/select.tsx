import type {
    ButtonProps,
    ListBoxItemProps,
    ListBoxProps,
    SelectProps,
} from "react-aria-components"

import {
    Button,
    ListBox,
    ListBoxItem,
    Popover as _Popover,
    Select as _Select,
    SelectValue as _SelectValue,
} from "react-aria-components"

import { cn } from "~/utils/cn"

export const SelectValue = _SelectValue
export const Popover = _Popover
export const SelectList = ListBox

export function Select(props: SelectProps) {
    return <_Select {...props}></_Select>
}

export function SelectTrigger({ className, ...props }: ButtonProps) {
    return (
        <Button
            className={cn(
                "z-10 flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm whitespace-nowrap disabled:opacity-60 [&>span]:w-0 [&>span]:grow [&>span]:truncate [&>svg]:size-4.5 [&>svg]:shrink-0",
                className,
            )}
            {...props}
        ></Button>
    )
}

export function SelectContent({ className, ...props }: ListBoxProps<HTMLDivElement>) {
    return (
        <_Popover className="outline-none">
            <ListBox
                {...props}
                className={cn(
                    "bg-background shadow-cursor w-[var(--trigger-width)] rounded-md p-1 outline-none",
                    className,
                )}
            ></ListBox>
        </_Popover>
    )
}

export function SelectItem({ className, ...props }: ListBoxItemProps) {
    return (
        <ListBoxItem
            {...props}
            className={cn(
                "cursor-default rounded px-2 py-1 text-sm outline-none data-[focused=true]:bg-[#F3F5F6] data-[open=true]:bg-[#F3F5F6]",
                className,
            )}
        ></ListBoxItem>
    )
}
