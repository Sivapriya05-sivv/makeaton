"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.print()}
      className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    >
      <Printer className="mr-1.5 h-4 w-4" />
      Print Invoice
    </Button>
  );
}
