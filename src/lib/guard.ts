import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";

export type Role = "admin" | "staff" | "customer";

export type CurrentUser = {
  id: number;
  role: Role;
  email: string;
};

export async function requireUser(): Promise<CurrentUser> {
  const user = currentUser();

  if (!user) {
    throw NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return user as CurrentUser;
}

export async function requireRole(...allowed: Role[]): Promise<CurrentUser> {
  const user = currentUser();

  if (!user) {
    throw NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!allowed.includes(user.role as Role)) {
    throw NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return user as CurrentUser;
}

