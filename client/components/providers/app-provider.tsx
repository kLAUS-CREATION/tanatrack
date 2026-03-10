"use client";

import { ReactNode } from "react";
import ReduxProvider from "./redux-provider";
import ThemeProvider from "./theme.provider";
import AuthProvider from "./auth-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
