"use client";

import { ReactNode } from "react";
import ReduxProvider from "./redux-provider";
import ThemeProvider from "./theme.provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </ReduxProvider>
  );
}
