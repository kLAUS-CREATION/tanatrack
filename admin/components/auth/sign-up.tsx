"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerSchema } from "@/lib/validations/register.validation";
import { useRegisterMutation } from "@/lib/features/services/auth.api";

import { Button } from "../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import SectionHeading from "../shared/section-heading";

type RegisterFormValues = z.infer<typeof registerSchema>;

const SignUp = function () {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // RTK Query Mutation Hook
  const [register, { isLoading }] = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        // Optional: depending on your RegisterUser type requirements
        // callbackURL: `${window.location.origin}/auth/verify-email`,
      }).unwrap();

      const params = new URLSearchParams();
      params.set("email", values.email);
      router.push(`/auth/verify-email?${params.toString()}`);

    } catch (error: any) {
      console.error("Registration failed:", error);
      const errorMessage = error?.data?.message || "Registration failed. Please try again.";
      setServerError(errorMessage);
    }
  }

  return (
    <div className="size-full">
      <SectionHeading title1="Create Your" title2="Account" desc={null}/>

      {/* Global Error Alert */}
      {serverError && (
        <div className="mb-6 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-foreground text-sm flex items-center gap-x-2 uppercase tracking-[1px]">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p>{serverError}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isLoading}
                    type="text"
                    placeholder="Your Name"
                    className="h-11 rounded-lg border-foreground-tertiary/20 focus:border-[#003087] focus:ring-[#003087] transition"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isLoading}
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-lg border-foreground-tertiary/20 focus:border-[#003087] focus:ring-[#003087] transition"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
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
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      disabled={isLoading}
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pr-10 rounded-lg border-foreground-tertiary/20 transition"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                      onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SignUp;
