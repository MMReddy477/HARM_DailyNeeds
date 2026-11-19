import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { OwnerInfo } from "@/lib/types";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = useMutation({
    mutationFn: () => apiPost<OwnerInfo>("/auth/login", { username, password }),
    onSuccess: () => {
      beginSession();
      navigate("/admin", { replace: true });
    },
    onError: (err) => {
      setError(err instanceof ApiError && err.status === 401 ? "Invalid username or password" : "Login failed. Please try again.");
    },
  });

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#2E1065] lg:block">
        <img
          src="https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-20"
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <img src="/brand/harm-daily-needs-mark.svg" alt="" className="size-10 shrink-0" />
            <span className="font-heading text-base font-extrabold">H.A.R.M DAILY NEEDS</span>
          </div>
          <div>
            <p className="font-heading text-3xl font-extrabold leading-tight">Owner Control Centre</p>
            <p className="mt-3 max-w-md text-purple-200">
              Manage inventory, track Xerox &amp; printing revenue, log money transfers, and export reports —
              all from one secure dashboard.
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm text-purple-300">
            <ShieldCheck className="size-4" /> Private area — not visible to customers
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-purple-50 px-4 py-12">
        <form
          className="w-full max-w-sm rounded-2xl border border-purple-100 bg-white p-7 shadow-xl"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            login.mutate();
          }}
          data-testid="admin-login-form"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
            <Lock className="size-5" />
          </span>
          <h1 className="mt-4 font-heading text-xl font-extrabold text-purple-950">Owner Login</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to the H.A.R.M admin panel.</p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                data-testid="admin-login-username-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                data-testid="admin-login-password-input"
              />
            </div>
            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" data-testid="admin-login-error">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={!username || !password || login.isPending} data-testid="admin-login-submit-button">
              {login.isPending ? "Signing in…" : "Sign In"}
            </Button>
          </div>

          <Link to="/" data-testid="admin-login-back-link" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:text-purple-900">
            <ArrowLeft className="size-3.5" /> Back to store
          </Link>
        </form>
      </div>
    </div>
  );
}
