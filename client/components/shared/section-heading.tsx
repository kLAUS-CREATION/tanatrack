interface ISectionHeading {
    title1: string;
    title2: string | null;
    desc: string | null;
    center?: boolean;
}

export default function SectionHeading ({title1, title2, desc, center} : ISectionHeading) {
    return <div className={`w-full flex  flex-col  font-sans  ${center ? "text-center items-center" : "items-start"}`}>
        <h2 className="text-xl lg:text-2xl text-foreground font-semibold tracking-[.5px]">
            { title1 }
            { title2 && <span className="text-primary"> { title2 } </span> }
        </h2>

        <p className="text-foreground-secondary text-base lg:text-lg">
            { desc }
        </p>
    </div>
}
