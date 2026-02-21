"use client";

import Image from "next/image";
import React from "react";
import Logo from "../shared/logo";
import Link from "next/link";
import SectionHeading from "../shared/section-heading";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen w-full flex items-center justify-center">
        {/* LEFT SIDE: The Image Block */}
        <div className="hidden lg:flex w-[60%] h-full p-5 2xl:p-10">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src="/images/auth1.jpg"
              alt="Auth Hero"
              fill
              className="object-cover"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/40 to-primary/40" />

            <div className="absolute top-10 left-10 right-10 flex justify-between items-center">
              <span className="text-white font-medium tracking-wide text-sm opacity-90">Selected Works</span>
              <div className="flex items-center gap-4 text-white text-sm font-semibold">
                <Link href={'/auth/sign-up'} className="hover:opacity-70 transition text-foreground-secondary">Sign up</Link>
                <Link href={'/auth/sign-in'} className="hover:opacity-70 transition text-foreground-secondary">Sign In</Link>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT SIDE: The Form area */}
        <div className="flex-1 flex flex-col px-8 lg:px-16 py-10 overflow-y-auto">
          <div className="flex justify-between items-center mb-12">
            <Logo />
            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
              <span>🇬🇧 EN</span> <span className="text-[10px] text-gray-400">▼</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center max-w-lg">
            <div className="w-full flex flex-col justify-center items-center">
              <div className="text-center mb-10">
                <SectionHeading title1="Welcome To" title2={"Tana Track"} desc={null} />
              </div>
              {children}
            </div>
          </div>
        </div>

      </div>
  );
}
