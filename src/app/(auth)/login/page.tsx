"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Admin@123");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        setRedirecting(true);
        const destination =
          data.user?.role === "customer" ? "/portal/subscriptions" : "/dashboard";
        window.location.replace(destination);
        return;
      } else {
        setError(data.error || "Failed to sign in. Please verify your credentials.");
        setLoading(false);
      }
    } catch {
      setError("Unable to connect to the authentication service. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="px-4">
      <div className="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-indigo-600 inline-flex items-center gap-2"
          >
            <span className="h-6 w-2 bg-indigo-600 rounded-sm"></span>
            Brightloop
          </Link>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
            Sign in to your account
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Subscription billing &amp; ledger platform
          </p>
        </div>

        {/* Demo Quick Fill helper pills */}
        <div className="mb-6 rounded-lg bg-slate-50 p-3 border border-slate-200">
          <div className="text-xs font-medium text-slate-600 mb-2">
            Demo quick-fill credentials:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("admin@brightloop.io")}
              className="text-xs bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 px-2.5 py-1 rounded font-medium text-slate-700 transition-colors shadow-2xs"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("staff@brightloop.io")}
              className="text-xs bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 px-2.5 py-1 rounded font-medium text-slate-700 transition-colors shadow-2xs"
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("acme@customer.io")}
              className="text-xs bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 px-2.5 py-1 rounded font-medium text-slate-700 transition-colors shadow-2xs"
            >
              Customer
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={loading || redirecting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brightloop.io"
              className="border-slate-200 focus-visible:ring-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading || redirecting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-slate-200 focus-visible:ring-indigo-600"
            />
          </div>

          {error && (
            <div
              className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || redirecting}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-75 transition-all h-10"
          >
            {redirecting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to dashboard...
              </span>
            ) : loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="mt-6 flex flex-col space-y-2 text-center text-sm text-slate-500">
          <Link
            href="/forgot-password"
            className="text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            Forgot password?
          </Link>
          <div>
            <span>Don&apos;t have an account? </span>
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
