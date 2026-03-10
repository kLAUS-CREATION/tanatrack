"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShieldCheck, Mailbox } from "lucide-react";
import { InviteMemberForm } from "./invite-member";
import { RolePermissionsManager } from "./role-permission-manager";
import { PendingInvitesList } from "./pending-invites-list";
import { usePathname } from "next/navigation";

export default function MembershipSettingsPage() {
  const pathname = usePathname()
  const orgId = pathname.split("/")[3];
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">Team & Security</h1>
        <p className="text-muted-foreground text-lg">
          Manage your organization members, invite teammates, and define granular security roles.
        </p>
      </div>

      <Tabs defaultValue="members" className="w-full space-y-2">
        <TabsList className="">
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" /> Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-2">
            <Mailbox className="h-4 w-4" /> My Invitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <InviteMemberForm organizationId={orgId} />
          {/* You would add your Membership List table here */}
        </TabsContent>

        <TabsContent value="roles">
          <RolePermissionsManager organizationId={orgId} />
        </TabsContent>

        <TabsContent value="invites">
          <PendingInvitesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
