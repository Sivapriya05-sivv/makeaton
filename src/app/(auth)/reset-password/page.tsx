"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Invalid reset link
          </h2>
          <p className="text-sm text-slate-600">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <div className="pt-2">
          <Button
            asChild
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Link href="/forgot-password">Request new reset link</Link>
          </Button>
        </div>
        <div>
          <Link
            href="/login"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const isPasswordValid = PASSWORD_RULE.test(newPassword);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!PASSWORD_RULE.test(newPassword)) {
      setError(
        "Password must be at least 9 characters with uppercase, lowercase, and a special character"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage("Password updated");
        setTimeout(() => {
          router.replace("/login");
        }, 1500);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-lg">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="newPassword"
            className="text-sm font-medium text-slate-700"
          >
            New password
          </Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={loading}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border-slate-200 focus-visible:ring-indigo-600"
          />
          <div
            className={`flex items-center gap-1.5 text-xs ${
              isPasswordValid
                ? "font-medium text-emerald-600"
                : "text-slate-500"
            }`}
          >
            {isPasswordValid && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
            <span>
              At least 9 characters, one uppercase, one lowercase, one special character
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-700"
          >
            Confirm new password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={loading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border-slate-200 focus-visible:ring-indigo-600"
          />
        </div>

        {error && (
          <div className="text-sm text-rose-600" role="alert">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Updating password..." : "Update password"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="px-4">
      <div className="mx-auto mt-24 max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-indigo-600"
          >
            Brightloop
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            Reset your password
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="py-8 text-center text-sm text-slate-500">
              Loading...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

