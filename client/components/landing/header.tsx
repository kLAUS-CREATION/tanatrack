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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-primary/5">
      <nav className="container mx-auto h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20">
            <Box size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Tana <span className="text-primary italic">Track</span>
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
          <HeaderAuth />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Header;
