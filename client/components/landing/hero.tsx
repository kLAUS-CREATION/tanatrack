"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, Check } from "lucide-react";
import { useGetSessionQuery } from "@/lib/features/services/auth.api";

const trustPoints = ["14-day free trial", "No credit card", "Cancel anytime"];

const Hero = function () {
  const { data: session, isLoading } = useGetSessionQuery();
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <section className="container mx-auto min-h-[calc(100vh-4rem)] pt-12 pb-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden">
      <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-linear-to-b from-primary/20 dark:from-primary/10 to-secondary/10 blur-[120px] -z-0" />

      <div className="w-full lg:w-[48%] space-y-5 z-10">
        {/* Eyebrow badge — adapts to auth state */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 pl-1.5 pr-3 py-1 text-xs">
          <span className="text-foreground-tertiary font-medium">
            {firstName ? `Welcome back, ${firstName}` : "Real-time multichannel sync is live"}
          </span>
        </div>

        <h1 className="text-3xl lg:text-4xl 2xl:text-5xl leading-[1.08] font-clash tracking-tight">
          Master Your <span className="text-primary">Inventory</span> <br />
          <span className="font-satoshi text-foreground-secondary italic">
            Scale Your Business.
          </span>
        </h1>

        <p className="text-sm lg:text-base font-normal leading-relaxed max-w-md text-foreground-tertiary">
          The all-in-one platform to track, manage, and optimize your stock across
          every channel — with real-time insights for ambitious brands.
        </p>

        {/* CTAs — swap when authenticated */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          {isLoading ? (
            <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
          ) : session ? (
            <>
              <Button asChild className="group">
                <Link href="/organizations">
                  Open Organizations
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="group">
                <Link href="/auth/sign-up">
                  Start Free Trial
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button variant="outline" className="group">
                <Play className="size-3.5 fill-current" />
                Watch Demo
              </Button>
            </>
          )}
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3">
          {trustPoints.map((point) => (
            <div
              key={point}
              className="flex items-center gap-1.5 text-xs text-foreground-quaternary font-medium"
            >
              <Check className="size-3.5 text-primary stroke-[3px]" />
              {point}
            </div>
          ))}
        </div>
      </div>

      {/* Framed product preview */}
      <div className="w-full lg:w-[50%] relative z-10 group">
        <div className="absolute -inset-3 rounded-2xl bg-linear-to-tr from-primary/15 to-secondary/10 blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-700" />
        <div className="relative rounded-tl-3xl rounded-xs border border-primary/15 bg-background2 p-1.5 shadow-2xl shadow-primary/5">
          <div className="flex items-center gap-1.5 px-2.5 py-2">
            <span className="size-2 rounded-full bg-destructive/60" />
            <span className="size-2 rounded-full bg-chart-5/60" />
            <span className="size-2 rounded-full bg-primary/60" />
            <span className="ml-2 text-[10px] text-foreground-quaternary font-mono tracking-wide">
              app.tanatrack.com/organizations
            </span>
          </div>
          <Image
            src={"/images/hero1.jpg"}
            alt="Tana Track Inventory Dashboard"
            width={1200}
            height={800}
            className="rounded-tl-2xl rounded-xs object-cover w-full transition-transform duration-700 group-hover:scale-[1.01]"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
