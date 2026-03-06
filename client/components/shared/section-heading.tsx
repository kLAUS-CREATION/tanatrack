interface ISectionHeading {
    title1: string;
    title2: string | null;
    desc: string | null;
    center?: boolean;
}

export default function SectionHeading ({title1, title2, desc, center} : ISectionHeading) {
    return <div className={`w-full flex  flex-col gap-2  ${center ? "text-center items-center" : "items-start"}`}>
        <h2 className="text-xl lg:text-2xl 2xl:text-3xl font-clash tracking-[1px]">
            { title1 }
            { title2 && <span className="text-primary"> { title2 } </span> }
        </h2>

        <p className="text-foreground-tertiary tracking-[1px] font-satoshi text-base lg:text-xl">
            { desc }
        </p>
    </div>
}
