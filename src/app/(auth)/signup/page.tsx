"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isPasswordValid = PASSWORD_RULE.test(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const destination =
          data.user?.role === "customer" ? "/portal/subscriptions" : "/dashboard";
        window.location.href = destination;
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4">
      <div className="mx-auto mt-20 max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-indigo-600"
          >
            Brightloop
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            Create an account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="border-slate-200 focus-visible:ring-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              autoComplete="new-password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-slate-200 focus-visible:ring-indigo-600"
            />
            <div className="mt-1 space-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Check
                  className={`h-3.5 w-3.5 ${
                    password.length >= 9
                      ? "text-emerald-600"
                      : "text-slate-300"
                  }`}
                />
                <span>At least 9 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check
                  className={`h-3.5 w-3.5 ${
                    /[a-z]/.test(password) && /[A-Z]/.test(password)
                      ? "text-emerald-600"
                      : "text-slate-300"
                  }`}
                />
                <span>Uppercase and lowercase letters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check
                  className={`h-3.5 w-3.5 ${
                    /[^A-Za-z0-9]/.test(password)
                      ? "text-emerald-600"
                      : "text-slate-300"
                  }`}
                />
                <span>At least one symbol</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-600" role="alert">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <span>Already have an account? </span>
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
