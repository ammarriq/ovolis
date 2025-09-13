import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "~/utils/cn";
function Switch({ isOn }) {
    return (_jsx("div", { className: cn("ml-auto grid w-10 place-items-center rounded-md py-0.5 font-semibold text-[#fff]", isOn ? "bg-green-600" : "bg-red-600"), children: isOn ? "On" : "Off" }));
}
export default Switch;
//# sourceMappingURL=switch.js.map