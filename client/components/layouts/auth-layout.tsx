"use client";

import Image from "next/image";
import React from "react";
import Logo from "../shared/logo";
import Link from "next/link";
import { ShieldCheck, Zap, TrendingUp, Star } from "lucide-react";
import ThemeToggle from "../shared/theme-toggle";

const highlights = [
  { icon: ShieldCheck, label: "99.9% stock accuracy" },
  { icon: Zap, label: "40% faster fulfillment" },
  { icon: TrendingUp, label: "Real-time multichannel sync" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen w-full flex items-stretch">
      {/* LEFT SIDE: Branded image panel */}
      <div className="hidden lg:flex w-[55%] h-full relative overflow-hidden">
        <Image
          src="/images/auth1.jpg"
          alt="Tana Track"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/30" />
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
        {/* animated brand glow */}
        <div className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-linear-to-b from-primary/30 to-secondary/10 blur-[120px] animate-pulse" />

        {/* Top bar */}
        <div className="absolute top-8 left-10 right-10 flex justify-between items-center z-10">
          <span className="text-white font-clash text-lg font-bold tracking-tight">
            Tana <span className="italic font-normal">Track</span>
          </span>
          <div className="flex items-center gap-4 text-white/90 text-xs font-semibold">
            <Link href="/auth/sign-up" className="hover:text-white transition">Sign up</Link>
            <Link href="/auth/sign-in" className="hover:text-white transition">Sign in</Link>
          </div>
        </div>

        {/* Bottom marketing block */}
        <div className="absolute bottom-10 left-10 right-10 z-10 space-y-6">
          {/* testimonial glass card */}
          <figure className="max-w-md rounded-tl-2xl rounded-xs border border-white/15 bg-white/10 backdrop-blur-md p-5 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex gap-0.5 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-primary text-primary" />
              ))}
            </div>
            <blockquote className="text-white/90 text-sm leading-relaxed">
              “We replaced three spreadsheets and a clipboard with Tana Track.
              Stockouts dropped to almost zero and the team finally trusts the numbers.”
            </blockquote>
            <figcaption className="flex items-center gap-3 pt-1">
              <div className="size-9 rounded-full overflow-hidden border border-white/20">
                <Image
                  src="https://i.pravatar.cc/80?u=11"
                  alt="Customer"
                  width={36}
                  height={36}
                />
              </div>
              <div className="text-xs">
                <p className="text-white font-semibold leading-tight">Sara Mengistu</p>
                <p className="text-white/60">Ops Lead, Habesha Goods</p>
              </div>
            </figcaption>
          </figure>

          <h2 className="text-white text-2xl xl:text-3xl font-clash font-semibold leading-tight max-w-md">
            Master your inventory.{" "}
            <span className="text-primary italic font-normal">Scale your business.</span>
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div
                  key={h.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-white/90"
                >
                  <Icon className="size-3.5 text-primary" />
                  {h.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Form area */}
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-16 py-8 overflow-y-auto bg-background relative">
        {/* soft accent glow behind the form on mobile/desktop */}
        <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/5 blur-[100px] -z-0" />

        <div className="relative z-10 flex justify-between items-center mb-10">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-[11px] font-bold text-foreground-secondary">
              EN (US)
            </span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full">
          <div className="w-full max-w-sm flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>

        <p className="relative z-10 text-center text-[11px] text-foreground-quaternary mt-8">
          By continuing you agree to our{" "}
          <Link href="#" className="text-foreground-tertiary hover:text-primary font-medium">Terms</Link>{" "}
          &amp;{" "}
          <Link href="#" className="text-foreground-tertiary hover:text-primary font-medium">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
