"use client"
import { useGetSessionQuery } from "@/lib/features/services/auth.api"
import { Button } from "../ui/button";
import Link from "next/link";

export default function HeaderAuth() {
    const {data: session, isLoading} = useGetSessionQuery();
    console.log(session)
    if (isLoading) {
        return <h1> Loading </h1>
    }


    if (session && !isLoading) {
        return (
            <Button asChild variant={"outline"}>
                <Link href="/dashboard">Dashboard</Link>
            </Button>
        )
    }

    return (
        <Button asChild>
            <Link href="/auth/sign-up">Sign Up</Link>
        </Button>
    )
}


