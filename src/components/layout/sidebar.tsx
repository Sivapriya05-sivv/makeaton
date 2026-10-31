"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Percent,
  Tag,
  Repeat,
  Receipt,
  Wallet,
  Users,
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "staff" | string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Plans", href: "/plans", icon: Layers },
  { label: "Taxes", href: "/taxes", icon: Percent },
  { label: "Discounts", href: "/discounts", icon: Tag, adminOnly: true },
  { label: "Subscriptions", href: "/subscriptions", icon: Repeat },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Payments", href: "/payments", icon: Wallet },
  { label: "Staff", href: "/staff", icon: Users, adminOnly: true },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && role !== "admin") {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 p-4 h-screen sticky top-0 flex flex-col">
      <div className="px-3 py-2 mb-6">
        <Link
          href="/dashboard"
          className="text-xl font-semibold text-indigo-400 tracking-tight"
        >
          Brightloop
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {filteredItems.map((item) => {
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

export default Sidebar;

