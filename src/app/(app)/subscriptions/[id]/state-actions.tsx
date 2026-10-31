"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const POSSIBLE_TARGET_STATES = [
  "quotation",
  "confirmed",
  "active",
  "closed",
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["quotation"],
  quotation: ["confirmed"],
  confirmed: ["active"],
  active: ["closed"],
  closed: [],
};

interface StateActionsProps {
  subscriptionId: number;
  currentState: string;
}

export function StateActions({
  subscriptionId,
  currentState,
}: StateActionsProps) {
  const router = useRouter();
  const [loadingTo, setLoadingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowedTransitions = VALID_TRANSITIONS[currentState] || [];

  const handleTransition = async (to: string) => {
    setError(null);
    setLoadingTo(to);

    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed to transition state to ${to}.`);
        return;
      }

      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to execute state transition.");
    } finally {
      setLoadingTo(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">
          Transitions:
        </span>
        {POSSIBLE_TARGET_STATES.map((target) => {
          const isEnabled = allowedTransitions.includes(target);
          const isLoading = loadingTo === target;

          return (
            <Button
              key={target}
              size="sm"
              variant={isEnabled ? "default" : "outline"}
              disabled={!isEnabled || loadingTo !== null}
              onClick={() => handleTransition(target)}
              className={
                isEnabled
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 capitalize shadow-sm text-xs h-8 px-3"
                  : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed capitalize text-xs h-8 px-3"
              }
            >
              {isLoading ? "Updating..." : `Mark as ${target}`}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
