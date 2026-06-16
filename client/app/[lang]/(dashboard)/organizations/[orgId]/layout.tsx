import DashboardLayout from "@/components/layouts/dashboard-layout";
import React from "react";

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout>
        {children}
    </DashboardLayout>
}
