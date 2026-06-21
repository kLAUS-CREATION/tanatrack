"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/dashboard/shared/page-shell";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { Store, ShoppingBag, ChevronRight } from "lucide-react";
import { useGetSellableBranchesQuery } from "@/lib/features/services/sales.api";

export default function NewSaleBranchPickerPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const orgId = params.orgId as string;

  const { data: branches, isLoading } = useGetSellableBranchesQuery(orgId);

  // Single sellable branch → skip the picker entirely.
  const only = branches?.length === 1 ? branches[0] : null;
  useEffect(() => {
    if (only) {
      router.replace(`/${lang}/organizations/${orgId}/new-sale/${only.id}`);
    }
  }, [only, router, lang, orgId]);

  return (
    <PageShell
      title="New Sale"
      subtitle="Choose a branch to sell from."
      actionCount={0}
      loading={isLoading || !!only}
      empty={!branches || branches.length === 0}
      emptyState={
        <EmptyState
          icon={ShoppingBag}
          title="No branches available"
          description="You don't have permission to record sales at any branch."
        />
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {branches?.map((b) => (
          <Link
            key={b.id}
            href={`/${lang}/organizations/${orgId}/new-sale/${b.id}`}
            className="group flex items-center gap-3 rounded-sm border border-border bg-background2 p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{b.name}</span>
              <span className="block text-xs text-muted-foreground">
                Record a sale here
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
