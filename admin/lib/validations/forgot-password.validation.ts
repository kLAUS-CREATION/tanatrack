import * as z from "zod"

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 symbol"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  })

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>
