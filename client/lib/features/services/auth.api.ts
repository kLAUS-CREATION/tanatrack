import { apiSlice } from "../api";
import type { RegisterUser } from "@/types/user/regitserUser";
import type { ISignIn } from "@/types/user/sign-in";
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types/user/password-reset";

import type { Session, User } from "@/lib/auth-client";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
  useRegisterMutation,
  useSignInMutation,
  useSignOutMutation,
  useGoogleOAuthMutation,
  useGetSessionQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
