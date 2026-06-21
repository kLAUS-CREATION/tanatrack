import { createAuthClient } from "better-auth/client";

// Plugins
import { emailOTPClient } from "better-auth/client/plugins";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("Cannot get the backend url");
}

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [emailOTPClient()],
});

export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];
