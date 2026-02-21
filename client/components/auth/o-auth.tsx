"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useGoogleOAuthMutation } from "@/lib/features/services/auth.api";

export default function OAuth() {
  const [serverError, setServerError] = useState<string | null>(null);

  // RTK Query Mutation Hook
  const [googleOAuth, { isLoading }] = useGoogleOAuthMutation();

  const handleOAuth = async () => {
    setServerError(null);

    try {
      // 1. Trigger the mutation
      const response = await googleOAuth().unwrap();

      // 2. Based on your API definition: googleOAuth returns { url: string }
      // We must redirect the browser to the Google OAuth page
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (err: any) {
      console.error("Google OAuth failed:", err);
      const errorMessage = err?.data?.message ?? "Google login failed.";
      setServerError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-4">
      {serverError && (
        <div className="p-3 rounded-md bg-destructive/15 text-sm flex items-center gap-x-2 border border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <p>{serverError}</p>
        </div>
      )}

      <Button
        className="text-foreground-secondary items-center gap-3 w-full h-11 rounded-lg"
        variant={"outline"}
        onClick={handleOAuth}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span>Continue With Google</span>
            <Image
              src="/icons/google.svg"
              alt="google"
              width={18}
              height={18}
              className="ml-2"
            />
          </>
        )}
      </Button>
    </div>
  );
}
