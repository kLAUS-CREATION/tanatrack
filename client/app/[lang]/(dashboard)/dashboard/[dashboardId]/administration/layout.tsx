import { AdministrationNav } from "@/components/dashboard/administration/administration-nav";
import { AdministrationGuard } from "@/components/dashboard/administration/administration-guard";

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdministrationGuard>
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground">
            Manage branches, warehouses, members, roles and organization settings.
          </p>
        </div>

        <AdministrationNav />

        <div>{children}</div>
      </div>
    </AdministrationGuard>
  );
}
