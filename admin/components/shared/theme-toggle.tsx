"use client";

import React, { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/features/store";
import { setTheme } from "@/lib/features/slices/theme.slice";

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDark);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme !== null) {
      const theme = JSON.parse(storedTheme);
      dispatch(setTheme(theme));
    }
  }, [dispatch]);

  const toggleTheme = () => {
    dispatch(setTheme(!isDarkMode));
    localStorage.setItem("theme", JSON.stringify(!isDarkMode));
  };

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      aria-label="Toggle theme "
      className="text-foreground-secondary"
    >
      {isDarkMode ? (
        <Sun className="size-6" />
      ) : (
        <Moon className="size-6" />
      )}
    </Button>
  );
}
