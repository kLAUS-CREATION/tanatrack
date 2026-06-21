"use client";

import { useSignOutMutation } from "@/lib/features/services/auth.api";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    showIcon?: boolean;
}

export function LogoutButton({ className, variant = "outline", showIcon = true }: LogoutButtonProps) {
    const [signOut, { isLoading }] = useSignOutMutation();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut().unwrap();
            // The auth-provider will automatically redirect since session will be null,
            // but we can also push manually for immediate feedback:
            router.push("/auth/sign-in");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <Button
            variant={variant}
            className={className}
            onClick={handleLogout}
            disabled={isLoading}
        >
            {showIcon && <LogOut className="mr-2 h-4 w-4" />}
            {isLoading ? "Logging out..." : "Log out"}
        </Button>
    );
}
