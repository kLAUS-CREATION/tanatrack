"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Parse pathname for breadcrumbs: /[lang]/organizations/[orgId]/[module]/...
  const pathSegments = pathname.split("/").filter(Boolean);
  const lang = pathSegments[0];
  const orgId = pathSegments[2];

  // Create breadcrumb items from segments after orgId
  const moduleSegments = pathSegments.slice(3);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 glass dark:glass-dark mb-2">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1 hover:bg-accent transition-colors" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4 hidden sm:block"
            />
            <Breadcrumb className="text-foreground-secondary">
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/${lang}/organizations/${orgId}`} className="hover:text-primary transition-colors font-medium">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {moduleSegments.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                {moduleSegments.map((segment, index) => {
                  const isLast = index === moduleSegments.length - 1;
                  const href = `/${lang}/organizations/${orgId}/${moduleSegments.slice(0, index + 1).join("/")}`;
                  const label = segment.charAt(0).toUpperCase() + segment.slice(1);

                  return (
                    <React.Fragment key={segment}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="font-semibold text-foreground">{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={href} className="hover:text-primary transition-colors">
                            {label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-full overflow-y-auto overflow-x-hidden">
          <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

