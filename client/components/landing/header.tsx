import React from "react";
import Link from "next/link";
import { Box } from "lucide-react";
import ThemeToggle from "../shared/theme-toggle";
import HeaderAuth from "./header-auth";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const Header = function () {
  return (
    <header className="size-full bg-background/80 backdrop-blur-md border-b border-primary/5">
      <nav className="w-[98%] lg:w-[95%] mx-auto h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group font-clash">
          <span className="text-2xl font-bold tracking-tight text-primary">
            Tana <span className="italic font-normal text-foreground">Track</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-foreground-tertiary hover:text-primary transition-colors duration-300 uppercase tracking-widest italic"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <HeaderAuth />
        </div>
      </nav>
    </header>
  );
};

export default Header;
