import type { Metadata } from "next";
import "../globals.css";

import { inter, clash, satoshi } from "../_ui_/fonts";
import { AppProviders } from "@/components/providers/app-provider";


export const metadata: Metadata = {
  title: "Tana Track",
  description: "All In One Resource Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${clash.variable} ${satoshi.variable} dark`}
      >
        <AppProviders>
          <div className="bg-background text-foreground">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
