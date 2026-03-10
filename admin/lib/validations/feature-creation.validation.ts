// schema.ts
import { z } from "zod";
import { FeatureType, FeatureCategory } from "@/types/features";

export const featureSchema = z.object({
  key: z.string().min(3, "Key must be at least 3 characters").regex(/^[a-z0-9_]+$/, "Uppercase, numbers, and underscores only"),
  name: z.string().min(2, "Name is too short"),
  description: z.string().optional(),
  type: z.nativeEnum(FeatureType),
  category: z.nativeEnum(FeatureCategory).optional(),
});
