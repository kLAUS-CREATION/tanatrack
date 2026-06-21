"use client";

import Link from "next/link";
import {
  Mail,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Building2,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSessionQuery } from "@/lib/features/services/auth.api";
import { useGetOrganizationsQuery } from "@/lib/features/services/organization.api";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const initials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function Profile() {
  const { data: session, isLoading } = useGetSessionQuery();
  const { data: organizations, isLoading: isLoadingOrgs } =
    useGetOrganizationsQuery();

  const user = session?.user;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <main className="mx-auto w-[98%] max-w-3xl py-10">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <UserIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              You need to be signed in to view your profile.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isVerified = Boolean(user.emailVerified);

  return (
    <main className="mx-auto w-[98%] max-w-3xl space-y-6 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-linear-to-r from-primary/15 to-secondary/10" />
        <CardContent className="-mt-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:text-left">
          <Avatar className="h-20 w-20 rounded-2xl border-4 border-background shadow-sm">
            <AvatarImage
              src={user.image || "/image/profile-placeholder.svg"}
              alt={user.name || "Profile"}
            />
            <AvatarFallback className="rounded-2xl text-lg font-semibold">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {user.name || "Unnamed user"}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="pb-1">
            {isVerified ? (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                Unverified
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailRow icon={UserIcon} label="Full name" value={user.name || "—"} />
          <DetailRow icon={Mail} label="Email" value={user.email || "—"} />
          <DetailRow
            icon={isVerified ? ShieldCheck : ShieldAlert}
            label="Email status"
            value={isVerified ? "Verified" : "Not verified"}
          />
          <DetailRow
            icon={Calendar}
            label="Member since"
            value={formatDate(user.createdAt)}
          />
        </CardContent>
      </Card>

      {/* Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOrgs ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : organizations && organizations.length > 0 ? (
            <ul className="divide-y divide-border">
              {organizations.map((org) => (
                <li key={org.id}>
                  <Link
                    href={`/organizations/${org.id}`}
                    className="group flex items-center gap-3 py-3 transition-colors hover:text-primary"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {org.subscription?.plan?.name || "No plan"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              You don&apos;t belong to any organizations yet.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto w-[98%] max-w-3xl space-y-6 py-8">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
    </main>
  );
}
