"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password.")
});
type LoginValues = z.infer<typeof loginSchema>;

export function OwnerLoginForm() {
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  });

  const submit = async (values: LoginValues) => {
    setServerError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json() as { redirect?: string; message?: string };
      if (!response.ok) {
        setServerError(result.message || "Invalid username or password. Please try again.");
        return;
      }
      window.location.assign(result.redirect || "/admin");
    } catch (error) {
      console.error("Could not reach owner sign-in:", error);
      setServerError("Sign-in is unavailable right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="login-screen"><section className="login-card">
    <Link className="logo-lockup" href="/" aria-label="H.A.R Daily Needs home"><span className="logo-mark">H<span>.</span></span><span><strong>H.A.R</strong><small>OWNER ACCESS</small></span></Link>
    <span className="eyebrow">PRIVATE SHOP TOOLS</span><h1>Welcome back.</h1><p>Sign in to manage your inventory, daily sales and services.</p>
    <form className="login-form" onSubmit={handleSubmit(submit)} noValidate>
      <label>Username<input autoComplete="username" {...register("username")} aria-invalid={Boolean(errors.username)} />{errors.username && <small className="form-field-error">{errors.username.message}</small>}</label>
      <label>Password<input type="password" autoComplete="current-password" {...register("password")} aria-invalid={Boolean(errors.password)} />{errors.password && <small className="form-field-error">{errors.password.message}</small>}</label>
      {serverError && <p className="login-error" role="alert">{serverError}</p>}
      <button className="button-primary" type="submit" disabled={submitting}>{submitting ? "Checking details…" : <><KeyRound size={16} /> Sign in securely <ArrowRight size={16} /></>}</button>
    </form>
    <p className="login-note">Owner access is verified on the server. Incorrect details will not open the dashboard.</p>
    <Link className="login-back" href="/"><ArrowLeft size={15} /> Back to the public website</Link>
  </section></main>;
}
