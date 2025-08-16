import Header from "./-header"

const HomePage = () => {
    return (
        <div className="w-full h-screen bg-background shadow-lg flex flex-col border">
            <Header />

            <div className="flex items-center p-4 grow justify-center">
                <button
                    onClick={() => console.log("done")}
                    className="cursor-pointer size-24 rounded-full bg-primary grid place-items-center text-foreground-primary font-bold"
                >
                    Record
                </button>
            </div>
        </div>
    )
}

{
    /* <svg
    xmlns="http://www.w3.org/2000/svg"
    width={15}
    height={15}
    viewBox="0 0 15 15"
    strokeWidth={1}
    style={{ rotate: "180deg" }}
    {...props}
>
    <path
        fill="none"
        stroke="currentColor"
        d="M10.5 10.5v3a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3m0-3v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1Z"
    ></path>
</svg> */
}

export default HomePage
