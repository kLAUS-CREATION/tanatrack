import * as z from "zod"

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^[0-9]{6}$/, "Code must contain only numbers"),
})

export type VerifyEmailForm = z.infer<typeof verifyEmailSchema>
