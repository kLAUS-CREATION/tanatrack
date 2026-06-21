import Link from "next/link";

export default function Logo () {
    return (
        <h1 className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent text-lg lg:text-xl first-letter:text-3xl tracking-[1px]">
            <Link href="/">Tana Track</Link>
        </h1>
    )
}
