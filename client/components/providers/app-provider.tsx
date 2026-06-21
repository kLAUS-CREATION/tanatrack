"use client";

import { ReactNode } from "react";
import ReduxProvider from "./redux-provider";
import ThemeProvider from "./theme.provider";
import AuthProvider from "./auth-provider";
import NotificationProvider from "./notification-provider";
import { Toaster } from "@/components/ui/sonner";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            {/* Global toast host — required for any toast.success/error to render. */}
            <Toaster position="top-right" closeButton richColors />
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
