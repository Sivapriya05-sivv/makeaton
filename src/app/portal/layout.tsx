import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { PortalSidebar, PortalTopbar } from "./components/portal-nav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "customer") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalSidebar />
      <div className="flex flex-1 flex-col">
        <PortalTopbar user={user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

