"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formSchema } from "@/lib/validations/login.validation";
import { useSignInMutation } from "@/lib/features/services/auth.api"; // Ensure this path matches your file structure

import { Button } from "../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";

import { Input } from "../ui/input";
import SectionHeading from "../shared/section-heading";

type FormValues = z.infer<typeof formSchema>;

export function SignIn() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // RTK Query Mutation Hook
  const [signIn, { isLoading }] = useSignInMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);

    try {
      // .unwrap() is used with RTK Query to handle the result in a try/catch block
      await signIn({
        email: values.email,
        password: values.password,
      }).unwrap();

      // Honor a `redirect` target (e.g. an invite-accept link that bounced
      // an unauthenticated user here), otherwise land on the home page.
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      router.push(redirect || "/");
    } catch (error: any) {
      console.error("Login failed:", error);
      // RTK Query errors are usually structured as error.data.message
      const errorMessage = error?.data?.message || "Something Went Wrong";
      setServerError(errorMessage);
    }
  }

  return (
    <div className="size-full">

      <SectionHeading title1="Welcome" title2={"Back"} desc={null} />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    disabled={isLoading}
                    placeholder="you@example.com"
                    className="h-11 rounded-lg border-foreground-tertiary/20 focus:border-[#003087] focus:ring-[#003087] transition"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      disabled={isLoading}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pr-10 rounded-lg border-foreground-tertiary/20 transition"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <div className="mb-6 p-3 rounded-md bg-destructive/5 dark:bg-destructive/3 text-foreground text-sm flex items-center gap-x-2 border border-destructive/20 uppercase font-normal tracking-[1px]">
              <p>{serverError}</p>
            </div>
          )}

          <div className="flex items-center justify-end">
            <Link
              href="/auth/forgot-password"
              className={`text-sm font-semibold hover:underline text-foreground-secondary ${isLoading ? "pointer-events-none opacity-50" : ""
                }`}
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
