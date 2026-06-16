import React from "react";
import Link from "next/link";
import ThemeToggle from "../shared/theme-toggle";
import HeaderAuth from "./header-auth";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const Header = function () {
  return (
    <header className="size-full bg-background/70 backdrop-blur-xl border-b border-primary/10">
      <nav className="container mx-auto h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group font-clash">
          <span className="text-lg font-bold tracking-tight text-primary">
            Tana <span className="italic font-normal text-foreground">Track</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-bold text-foreground-tertiary hover:text-primary transition-colors duration-300 uppercase tracking-[0.2em]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HeaderAuth />
        </div>
      </nav>
    </header>
  );
};

export default Header;
