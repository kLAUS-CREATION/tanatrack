interface ISectionHeading {
    title1: string;
    title2: string | null;
    desc: string | null;
}

export default function SectionHeading ({title1, title2, desc} : ISectionHeading) {
    return <div className="flex items-start flex-col gap-4">
        <h2 className="text-3xl lg:text-4xl 2xl:text-5xl font-clash tracking-[1px]">
            { title1 }
            { title2 && <span className="text-primary"> { title2 } </span> }
        </h2>

        <p className="text-foreground-secondary tracking-[1px] font-satoshi text-base lg:text-xl">
            { desc }
        </p>
    </div>
}
