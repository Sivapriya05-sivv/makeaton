"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Package,
  Layers,
  Percent,
  Tag,
  Users,
  Repeat,
  Receipt,
  Wallet,
  UserCog,
  FileText,
} from "lucide-react";

export interface SidebarProps {
  role?: "admin" | "staff" | string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Revenue Guardian", href: "/guardian", icon: ShieldAlert },
    ],
  },
  {
    group: "CATALOG",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Plans & Pricing", href: "/plans", icon: Layers },
      { label: "Tax Configuration", href: "/taxes", icon: Percent },
      { label: "Discount Rules", href: "/discounts", icon: Tag },
    ],
  },
  {
    group: "SALES & CUSTOMERS",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Subscriptions", href: "/subscriptions", icon: Repeat },
    ],
  },
  {
    group: "BILLING & FINANCE",
    items: [
      { label: "Invoices", href: "/invoices", icon: Receipt },
      { label: "Payments", href: "/payments", icon: Wallet },
    ],
  },
  {
    group: "ADMINISTRATION",
    items: [
      { label: "Staff Management", href: "/staff", icon: UserCog },
      { label: "Audit Logs", href: "/audit", icon: FileText },
    ],
  },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 p-4 min-h-screen sticky top-0 flex flex-col border-r border-slate-800">
      <div className="px-3 py-2 mb-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-white tracking-tight flex items-center gap-2"
        >
          <span className="h-6 w-2 bg-indigo-500 rounded-sm"></span>
          <span>Brightloop</span>
        </Link>
        {role && (
          <span className="text-[10px] uppercase font-semibold tracking-wider bg-slate-800 text-indigo-400 px-2 py-0.5 rounded border border-slate-700">
            {role}
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.group} className="space-y-1">
            <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {group.group}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
