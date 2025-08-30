import type {
    ButtonProps,
    MenuItemProps,
    MenuProps,
    MenuTriggerProps,
    SubmenuTriggerProps,
} from "react-aria-components"

import {
    Button,
    Menu as _Menu,
    MenuItem as _MenuItem,
    MenuTrigger as _MenuTrigger,
    Popover as _Popover,
    SubmenuTrigger as _SubmenuTrigger,
} from "react-aria-components"

import { cn } from "~/utils/cn"

export const Popover = _Popover
export const MenuList = _Menu

export function Menu(props: MenuTriggerProps) {
    return <_MenuTrigger {...props}></_MenuTrigger>
}

export function MenuTrigger({ className, ...props }: ButtonProps) {
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

export function MenuContent({ className, ...props }: MenuProps<HTMLDivElement>) {
    return (
        <_Popover className="outline-none">
            <_Menu
                {...props}
                className={cn(
                    "bg-background shadow-cursor w-[var(--trigger-width)] rounded-md p-1 outline-none",
                    className,
                )}
            ></_Menu>
        </_Popover>
    )
}

export function MenuItem({ className, ...props }: MenuItemProps) {
    return (
        <_MenuItem
            {...props}
            className={cn(
                "cursor-default rounded px-2 py-1 text-sm outline-none data-[focused=true]:bg-[#F3F5F6] data-[open=true]:bg-[#F3F5F6]",
                className,
            )}
        ></_MenuItem>
    )
}

export function SubmenuTrigger(props: SubmenuTriggerProps) {
    return <_SubmenuTrigger {...props}></_SubmenuTrigger>
}
