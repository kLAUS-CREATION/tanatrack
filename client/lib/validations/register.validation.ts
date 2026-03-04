import * as z from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),

    email: z.string().trim().email("Please enter a valid email address"),

    password: z
      .string()
      .min(6, "Password must be at least 8 characters")
  })

