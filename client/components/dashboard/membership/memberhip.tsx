"use client"

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Mailbox, UserPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { InviteMemberForm } from "./invite-member";
import { PendingInvitesList } from "./pending-invites-list";
import { MembersManager } from "./members-manager";
import {
  useGetMembersQuery,
  useGetMyInvitesQuery,
} from "@/lib/features/services/membership.api";

export default function MembershipSettingsPage() {
  const pathname = usePathname();
  const orgId = pathname.split("/")[3];

  const [tab, setTab] = useState("members");

  const { data: members } = useGetMembersQuery(orgId);
  const { data: invites } = useGetMyInvitesQuery();

  return (
    <div className="w-full flex flex-col gap-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" /> Members
            <CountBadge count={members?.length} />
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-2">
            <Mailbox className="h-4 w-4" /> My Invitations
            <CountBadge count={invites?.length} />
          </TabsTrigger>
          <TabsTrigger value="invite" className="gap-2">
            <UserPlus className="h-4 w-4" /> Invite Employee
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersManager organizationId={orgId} />
        </TabsContent>

        <TabsContent value="invites">
          <PendingInvitesList />
        </TabsContent>

        <TabsContent value="invite">
          {/* Jump back to the members list once an invite is sent. */}
          <InviteMemberForm organizationId={orgId} onInvited={() => setTab("members")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CountBadge({ count }: { count?: number }) {
  if (typeof count !== "number") return null;
  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground">
      {count}
    </span>
  );
}
