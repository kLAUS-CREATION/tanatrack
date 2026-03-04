"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/features/store";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDark);

  return (
    <div
      className={`${isDarkMode ? "dark" : ""}`}
    >
      {children}
    </div>
  );
}
