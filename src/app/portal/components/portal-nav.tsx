"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Repeat, Receipt, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PortalSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Subscriptions",
      href: "/portal/subscriptions",
      icon: Repeat,
    },
    {
      label: "Invoices",
      href: "/portal/invoices",
      icon: Receipt,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 p-4 h-screen sticky top-0 flex flex-col">
      <div className="px-3 py-2 mb-6">
        <Link
          href="/portal/subscriptions"
          className="text-xl font-semibold text-indigo-400 tracking-tight"
        >
          Brightloop
        </Link>
        <span className="block text-xs text-slate-400 font-medium mt-0.5">
          Customer Portal
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex gap-3 items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function PortalTopbar({
  user,
}: {
  user: { name: string; role: string };
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
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

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="text-sm font-medium text-slate-600">
        Customer Billing & Account
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">
            {user.name}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-700 border-slate-200 capitalize">
            Customer
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
