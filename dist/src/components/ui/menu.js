import { jsx as _jsx } from "react/jsx-runtime";
import { Button, Menu as _Menu, MenuItem as _MenuItem, MenuTrigger as _MenuTrigger, Popover as _Popover, SubmenuTrigger as _SubmenuTrigger, } from "react-aria-components";
import { cn } from "~/utils/cn";
export const Popover = _Popover;
export const MenuList = _Menu;
export function Menu(props) {
    return _jsx(_MenuTrigger, { ...props });
}
export function MenuTrigger({ className, ...props }) {
    return (_jsx(Button, { className: cn("z-10 flex w-full items-center gap-2 rounded-md bg-[#F3F4F6] px-3 py-2 text-left text-sm disabled:opacity-60", className), ...props }));
}
export function MenuContent({ className, ...props }) {
    return (_jsx(_Popover, { className: "outline-none", children: _jsx(_Menu, { ...props, className: cn("bg-background shadow-cursor w-[var(--trigger-width)] rounded-md p-1 outline-none", className) }) }));
}
export function MenuItem({ className, ...props }) {
    return (_jsx(_MenuItem, { ...props, className: cn("cursor-default rounded px-2 py-1 text-sm outline-none data-[focused=true]:bg-[#F3F5F6] data-[open=true]:bg-[#F3F5F6]", className) }));
}
export function SubmenuTrigger(props) {
    return _jsx(_SubmenuTrigger, { ...props });
}
//# sourceMappingURL=menu.js.map