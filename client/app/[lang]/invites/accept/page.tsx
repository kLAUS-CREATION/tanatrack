import { Suspense } from "react";
import { AcceptInvite } from "@/components/invites/accept-invite";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvite />
    </Suspense>
  );
}
