"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  MailWarning,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useGetSessionQuery } from "@/lib/features/services/auth.api";
import { useAcceptInviteMutation } from "@/lib/features/services/membership.api";

interface ApiError {
  data?: { message?: string };
}

type Status = "idle" | "accepting" | "success" | "error";

export function AcceptInvite() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  const { data: session, isLoading: isSessionLoading } = useGetSessionQuery();
  const [acceptInvite] = useAcceptInviteMutation();

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard against the mutation firing twice (e.g. React strict mode / re-renders)
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token || isSessionLoading || !session?.user || hasAttempted.current) {
      return;
    }
    hasAttempted.current = true;

    (async () => {
      setStatus("accepting");
      try {
        await acceptInvite(token).unwrap();
        setStatus("success");
        toast.success("Invitation accepted! Welcome to the team.");
        setTimeout(() => router.replace("/organizations"), 2500);
      } catch (error) {
        const message =
          (error as ApiError)?.data?.message ||
          "This invitation is invalid or has expired.";
        setStatus("error");
        setErrorMessage(message);
        toast.error(message);
      }
    })();
  }, [token, session, isSessionLoading, acceptInvite, router]);

  const returnTo = `${pathname}?token=${token ?? ""}`;
  const signInHref = `/auth/sign-in?redirect=${encodeURIComponent(returnTo)}`;

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-sm animate-in fade-in zoom-in-95 duration-500">
        <Body
          token={token}
          isSessionLoading={isSessionLoading}
          hasSession={!!session?.user}
          status={status}
          errorMessage={errorMessage}
          signInHref={signInHref}
        />
      </div>
    </div>
  );
}

interface BodyProps {
  token: string | null;
  isSessionLoading: boolean;
  hasSession: boolean;
  status: Status;
  errorMessage: string | null;
  signInHref: string;
}

function Body({
  token,
  isSessionLoading,
  hasSession,
  status,
  errorMessage,
  signInHref,
}: BodyProps) {
  // 1. No token in the URL — the link is malformed.
  if (!token) {
    return (
      <State
        icon={<MailWarning className="h-12 w-12 text-destructive" />}
        title="Invalid invitation link"
        description="This link is missing its invitation token. Please use the link from your email."
        action={
          <Button asChild variant="outline">
            <Link href="/organizations">Go to your organizations</Link>
          </Button>
        }
      />
    );
  }

  // 2. Still resolving the session.
  if (isSessionLoading) {
    return (
      <State
        icon={<Loader2 className="h-12 w-12 animate-spin text-primary/60" />}
        title="Checking your session..."
        description="Hang tight while we verify your account."
      />
    );
  }

  // 3. Not signed in — send them to sign in and bring them back here.
  if (!hasSession) {
    return (
      <State
        icon={<LogIn className="h-12 w-12 text-primary" />}
        title="You've been invited!"
        description="Sign in or create an account to accept this invitation and join the team."
        action={
          <Button asChild className="w-full">
            <Link href={signInHref}>Sign in to accept</Link>
          </Button>
        }
      />
    );
  }

  // 4. Accepting in progress.
  if (status === "accepting" || status === "idle") {
    return (
      <State
        icon={<Loader2 className="h-12 w-12 animate-spin text-primary/60" />}
        title="Accepting your invitation..."
        description="This will only take a moment."
      />
    );
  }

  // 5. Success.
  if (status === "success") {
    return (
      <State
        icon={<CheckCircle2 className="h-12 w-12 text-green-500" />}
        title="Invitation accepted!"
        description="Welcome aboard. Redirecting you to your organizations..."
        action={
          <Button asChild className="w-full">
            <Link href="/organizations">Continue</Link>
          </Button>
        }
      />
    );
  }

  // 6. Error (expired / invalid / already used).
  return (
    <State
      icon={<XCircle className="h-12 w-12 text-destructive" />}
      title="Couldn't accept invitation"
      description={errorMessage ?? "This invitation is invalid or has expired."}
      action={
        <Button asChild variant="outline" className="w-full">
          <Link href="/organizations">Go to your organizations</Link>
        </Button>
      }
    />
  );
}

interface StateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function State({ icon, title, description, action }: StateProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/40">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="w-full pt-2">{action}</div>}
    </div>
  );
}
