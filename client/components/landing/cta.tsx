"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useGetSessionQuery } from "@/lib/features/services/auth.api";

export default function CTA() {
  const { data: session } = useGetSessionQuery();

  return (
    <section className="container mx-auto py-16">
      <div className="relative overflow-hidden rounded-tl-3xl rounded-xs border border-primary/20 bg-primary/5 px-6 py-14 lg:px-16 text-center">
        <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[60%] h-[120%] rounded-full bg-linear-to-b from-primary/20 to-secondary/10 blur-[100px] -z-0" />

        <div className="relative z-10 mx-auto max-w-xl space-y-5">
          <h2 className="text-2xl lg:text-3xl font-clash font-semibold tracking-tight">
            Ready to take control of <br className="hidden sm:block" />
            <span className="text-primary">your inventory?</span>
          </h2>
          <p className="text-sm text-foreground-tertiary leading-relaxed max-w-md mx-auto">
            Join thousands of ambitious brands running their supply chain on Tana Track.
            Start free — no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {session ? (
              <Button asChild className="group">
                <Link href="/organizations">
                  Open Dashboard
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild className="group">
                  <Link href="/auth/sign-up">
                    Start Free Trial
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth/sign-in">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
