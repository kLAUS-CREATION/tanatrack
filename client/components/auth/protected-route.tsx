"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/hooks/auth/useGetSession";
import { Button } from "../ui/button";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: user, isLoading } = useSession();
  console.log("from protected route page", user);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/auth/sign-in");
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full gap-4 lg:gap-6">
        <div className="text-center">
          <h1 className="text-2xl lg:text-3xl font-normal mb-2 tracking[2px] text-foreground-secondary">Access Denied</h1>
          <p className="text-foreground-tertiary tracking-[1px]">Please sign in to continue.</p>
        </div>
        <Button variant={"btn"}>
            <Link href={'/auth/sign-in'}> Back to Login Page </Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
