"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/plans": "Plans",
  "/taxes": "Taxes",
  "/discounts": "Discounts",
  "/subscriptions": "Subscriptions",
  "/invoices": "Invoices",
  "/payments": "Payments",
  "/staff": "Staff",
};

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const getPageTitle = (path: string): string => {
    if (PAGE_TITLES[path]) {
      return PAGE_TITLES[path];
    }
    const rootSegment = `/${path.split("/")[1] || ""}`;
    return PAGE_TITLES[rootSegment] || "";
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch {
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const roleBadgeStyle =
    user.role === "admin"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{user.name}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${roleBadgeStyle}`}
          >
            {user.role}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs h-8 px-3"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          {loggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </header>
  );
}

export default Topbar;

