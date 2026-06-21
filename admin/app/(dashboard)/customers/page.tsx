import React from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/empty-state";

export default function Page() {
  return (
    <div className="flex w-full flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Customers
        </h1>
        <p className="text-muted-foreground">
          Organizations and their subscriptions across the platform.
        </p>
      </div>
      <EmptyState
        icon={Users}
        title="Coming soon"
        description="A platform-wide customer directory is on the way once the back-office organization endpoints are in place."
      />
    </div>
  );
}
