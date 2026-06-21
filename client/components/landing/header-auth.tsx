"use client"
import { useGetSessionQuery } from "@/lib/features/services/auth.api"
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import { User, Building2, CreditCard, Settings } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogoutButton } from "../auth/logout-button";

export default function HeaderAuth() {
    const { data: session, isLoading } = useGetSessionQuery();

    if (isLoading) {
        return (
            <div className="size-8 rounded-full bg-muted animate-pulse flex items-center justify-center shrink-0" />
        )
    }

    if (session) {
        return (
            <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="size-8 rounded-full overflow-hidden bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <Image
                            src={session.user?.image || "/images/profile-placeholder.svg"}
                            alt={session.user?.name || "Profile"}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                        />
                    </button>
                </DropdownMenuTrigger >
                <DropdownMenuContent className="w-56 bg-background" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {session.user?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href="/organizations" className="cursor-pointer w-full flex items-center">
                                <Building2 className="mr-2 h-4 w-4" />
                                <span>Organizations</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer w-full flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/plans" className="cursor-pointer w-full flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>See Plans</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <LogoutButton variant="ghost" className="w-full justify-start cursor-pointer px-2 h-auto py-1.5 focus:bg-accent focus:text-accent-foreground" showIcon={true} />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-1.5">
            <Button variant="ghost" asChild size="sm" className="h-8 text-xs">
                <Link href="/auth/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="h-8 text-xs">
                <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
        </div>
    )
}
