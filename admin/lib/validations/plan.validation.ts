import { z } from "zod";
import { PlanType } from "@/types/plans";

export const planSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slugs must be lowercase, numbers, and hyphens"),
  type: z.nativeEnum(PlanType),
  tagline: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().min(3).max(3).default("USD"),
  monthlyPrice: z.coerce.number().min(0).optional(),
  yearlyPrice: z.coerce.number().min(0).optional(),
  trialDays: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
  features: z.array(z.object({
    featureId: z.string().min(1, "Select a feature"),
    value: z.string().min(1, "Value is required"),
    overrideDescription: z.string().optional(),
  })).default([]),
});
