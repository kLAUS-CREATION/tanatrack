"use client"

import { useGetMyInvitesQuery, useAcceptInviteMutation } from "@/lib/features/services/membership.api";
import { Button } from "@/components/ui/button";
import { Building2, Check, X, Mailbox, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PendingInvitesList() {
  const { data: invites, isLoading } = useGetMyInvitesQuery();
  const [accept, { isLoading: isAccepting }] = useAcceptInviteMutation();

  const handleAccept = async (token: string) => {
    try {
      await accept(token).unwrap();
      toast.success("Invitation accepted! Welcome to the team.");
    } catch (e) {
      toast.error("Failed to accept invitation.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking invitations…
      </div>
    );
  }

  if (!invites?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg text-center">
        <Mailbox className="h-8 w-8 mb-3 text-muted-foreground/60" />
        <p className="font-medium">No pending invitations</p>
        <p className="text-sm text-muted-foreground">New team invites will show up here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-lg border flex items-center justify-center text-muted-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium truncate">{invite.organizationName}</h4>
              <p className="text-sm text-muted-foreground">Invited as {invite.roleType}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <X className="mr-1.5 h-4 w-4" /> Decline
            </Button>
            <Button size="sm" onClick={() => handleAccept(invite.token)} disabled={isAccepting}>
              <Check className="mr-1.5 h-4 w-4" /> Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
