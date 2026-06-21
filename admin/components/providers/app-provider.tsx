"use client";

import { ReactNode } from "react";
import ReduxProvider from "./redux-provider";
import ThemeProvider from "./theme.provider";
import AuthProvider from "./auth-provider";
import { Toaster } from "@/components/ui/sonner";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster richColors position="top-center" />
     </AuthProvider>
    </ReduxProvider>
  );
}
