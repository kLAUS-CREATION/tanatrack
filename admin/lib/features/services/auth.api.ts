import { apiSlice } from "../api";
import type { RegisterUser } from "@/types/user/regitserUser";
import type { ISignIn } from "@/types/user/sign-in";
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types/user/password-reset";

import type { Session, User } from "@/lib/auth-client";

export type OtpType = "email-verification" | "sign-in" | "forget-password";

export interface SendOtpRequest {
  email: string;
  type: OtpType;
}

export interface CheckOtpRequest {
  email: string;
  type: OtpType;
  otp: string;
}

export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
}

export interface SignInOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordOtpRequest {
  email: string;
  otp: string;
  password: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* -------------------------------------------------------------------------- */
    /*                         STANDARD AUTH ENDPOINTS                            */
    /* -------------------------------------------------------------------------- */

    register: builder.mutation<User, RegisterUser>({
      query: (body) => ({
        url: "/auth/sign-up/email",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    signIn: builder.mutation<Session, ISignIn>({
      query: (body) => ({
        url: "/auth/sign-in/email",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    signOut: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/sign-out",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    googleOAuth: builder.mutation<{ url: string }, void>({
      query: () => ({
        url: "/auth/sign-in/social",
        method: "POST",
        body: {
          provider: "google",
          callbackURL: `${window.location.origin}/`,
          errorCallbackURL: `${window.location.origin}/error`,
        },
      }),
    }),

    getSession: builder.query<Session | null, void>({
      query: () => ({
        url: "/auth/get-session",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),

    /* -------------------------------------------------------------------------- */
    /*                            EMAIL OTP ENDPOINTS                             */
    /* -------------------------------------------------------------------------- */

    // 1. Send an OTP (Verification, Sign-in, or Forget Password)
    sendVerificationOtp: builder.mutation<void, SendOtpRequest>({
      query: (body) => ({
        url: "/auth/email-otp/send-verification-otp",
        method: "POST",
        body,
      }),
    }),

    // 2. Check an OTP (Optional - checks validity without consuming)
    checkVerificationOtp: builder.mutation<void, CheckOtpRequest>({
      query: (body) => ({
        url: "/auth/email-otp/check-verification-otp",
        method: "POST",
        body,
      }),
    }),

    // 3. Verify Email with OTP (The final step for registration flow)
    verifyEmailOtp: builder.mutation<void, VerifyEmailOtpRequest>({
      query: (body) => ({
        url: "/auth/email-otp/verify-email",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    // 4. Sign In with OTP
    signInWithOtp: builder.mutation<Session, SignInOtpRequest>({
      query: (body) => ({
        url: "/auth/sign-in/email-otp",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    // 5. Request Password Reset with OTP (Sends the "forget-password" OTP)
    requestPasswordResetOtp: builder.mutation<void, { email: string }>({
      query: (body) => ({
        url: "/auth/email-otp/request-password-reset",
        method: "POST",
        body,
      }),
    }),

    // 6. Reset Password with OTP (The final step for password reset flow)
    resetPasswordOtp: builder.mutation<void, ResetPasswordOtpRequest>({
      query: (body) => ({
        url: "/auth/email-otp/reset-password",
        method: "POST",
        body,
      }),
    }),

    /* -------------------------------------------------------------------------- */
    /*                       LEGACY/STANDARD PASSWORD RESET                       */
    /* -------------------------------------------------------------------------- */

    forgotPassword: builder.mutation<void, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/request-password-reset",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  // Standard Hooks
  useRegisterMutation,
  useSignInMutation,
  useSignOutMutation,
  useGoogleOAuthMutation,
  useGetSessionQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,

  // OTP Specific Hooks
  useSendVerificationOtpMutation,
  useCheckVerificationOtpMutation,
  useVerifyEmailOtpMutation,
  useSignInWithOtpMutation,
  useRequestPasswordResetOtpMutation,
  useResetPasswordOtpMutation,
} = authApi;
