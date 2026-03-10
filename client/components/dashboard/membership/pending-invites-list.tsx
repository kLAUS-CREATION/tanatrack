"use client"

import { useGetMyInvitesQuery, useAcceptInviteMutation } from "@/lib/features/services/membership.api";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle, XCircle, Clock } from "lucide-react";
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

  if (isLoading) return <div className="text-center py-10">Checking invitations...</div>;

  if (!invites?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl opacity-50">
        <Clock className="h-12 w-12 mb-4" />
        <p className="text-xl font-medium">No pending invitations</p>
        <p className="text-sm text-muted-foreground">You will see new team invites here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {invites.map((invite) => (
        <div key={invite.id} className="flex items-center justify-between p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-lg">{invite.organizationName}</h4>
              <p className="text-sm text-muted-foreground italic">Invited as {invite.roleType}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="text-destructive">
              <XCircle className="mr-2 h-4 w-4" /> Decline
            </Button>
            <Button onClick={() => handleAccept(invite.token)} disabled={isAccepting}>
              <CheckCircle className="mr-2 h-4 w-4" /> Accept Invitation
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
