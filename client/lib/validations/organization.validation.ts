import { z } from "zod";
import { BillingInterval } from "@/types/organization";

export const createOrgSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters"),
  planId: z.string().min(1, "Please select a subscription plan"),
  billingInterval: z.nativeEnum(BillingInterval).default(BillingInterval.MONTHLY),
});
