import { createAuthClient } from "better-auth/client";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("Cannot get the backend url");
}

export const authClient = createAuthClient({
  baseURL: apiUrl,
});

export type Session = typeof authClient.$Infer.Session;
export type User = Session["user"];
