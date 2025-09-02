import { cn } from "~/utils/cn"

interface Props {
    isOn: boolean
}

function Switch({ isOn }: Props) {
    return (
        <div
            className={cn(
                "ml-auto grid w-10 place-items-center rounded-md py-0.5 font-semibold text-[#fff]",
                isOn ? "bg-green-600" : "bg-red-600",
            )}
        >
            {isOn ? "On" : "Off"}
        </div>
    )
}

export default Switch
