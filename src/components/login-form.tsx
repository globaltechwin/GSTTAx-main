"use client";

import { useState, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(3, "Password must be at least 3 characters"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const resolver = zodResolver(loginSchema) as Resolver<LoginFormData>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver,
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMeValue = watch("rememberMe");

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setIsLoading(true);
      setServerError(null);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: data.username,
            password: data.password,
          }),
        });

        const result = await response.json();

        if (result.success) {
          if (result.user) {
            localStorage.setItem("gsttax_user", JSON.stringify(result.user));
          }
          router.push("/dashboard");
        } else {
          setServerError(result.error || "Invalid credentials");
        }
      } catch {
        setServerError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-foreground text-sm font-semibold">
          Username
        </Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder="Enter username"
            autoComplete="username"
            disabled={isLoading}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
            className="input-premium border-border/80 placeholder:text-muted-foreground/40 focus:border-primary/40 h-10 rounded-lg bg-white/60 px-3 text-sm focus:bg-white"
            {...register("username")}
          />
        </div>
        {errors.username && (
          <p
            id="username-error"
            className="text-destructive mt-1 flex items-center gap-1.5 text-xs font-medium"
            role="alert"
          >
            <AlertCircle className="size-3.5 shrink-0" />
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-foreground text-sm font-semibold">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            autoComplete="current-password"
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="input-premium border-border/80 placeholder:text-muted-foreground/40 focus:border-primary/40 h-10 rounded-lg bg-white/60 px-3 pr-10 text-sm focus:bg-white"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 focus:ring-primary/20 absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 transition-all duration-200 focus:ring-2 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" strokeWidth={2} />
            ) : (
              <Eye className="size-4" strokeWidth={2} />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="password-error"
            className="text-destructive mt-1 flex items-center gap-1.5 text-xs font-medium"
            role="alert"
          >
            <AlertCircle className="size-3.5 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-me"
            checked={rememberMeValue}
            onCheckedChange={(checked) => setValue("rememberMe", checked === true)}
            disabled={isLoading}
            className="rounded-md"
          />
          <Label
            htmlFor="remember-me"
            className="text-muted-foreground cursor-pointer text-sm font-medium select-none"
          >
            Remember me
          </Label>
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="btn-gradient h-9 cursor-pointer rounded-lg border-0 px-5 text-sm font-semibold text-white"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <LogIn className="size-3.5" strokeWidth={2.5} />
              Log In
            </span>
          )}
        </Button>
      </div>

      {serverError && (
        <div
          className="bg-destructive/5 border-destructive/15 text-destructive animate-fade-in-up flex items-center gap-2.5 rounded-lg border p-3 text-sm"
          role="alert"
          style={{ animationDuration: "0.3s" }}
        >
          <div className="bg-destructive/10 inline-flex size-6 shrink-0 items-center justify-center rounded-md">
            <AlertCircle className="size-3.5" />
          </div>
          <span className="font-medium">{serverError}</span>
        </div>
      )}

      <div className="pt-1 text-center">
        <button
          type="button"
          className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200 focus:underline focus:outline-none"
          tabIndex={-1}
        >
          Forgot your password?
        </button>
      </div>
    </form>
  );
}
