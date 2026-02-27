"use client";

import Link from "next/link";
import { mainNavigationLinks } from "@/lib/constants/navigation-links";
import ThemeToggle from "../shared/theme-toggle";
import HeaderAuth from "./header-auth";

const Header = function () {

  return (
    <header className="container mx-auto py-4 lg:py-6  flex justify-between items-center  rounded-lg  border-b border-primary/[.1]">
      <div className="font-normal text-xl first-letter:text-2xl text-primary first-letter:font-bold uppercase">Tana_Track</div>

      <nav className="hidden md:flex items-center gap-6">
        {mainNavigationLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <HeaderAuth />
        <ThemeToggle />
      </div>

    </header>
  );
};

export default Header;
