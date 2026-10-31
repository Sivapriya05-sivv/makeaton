import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export function currentUser(): {
  id: number;
  role: string;
  email: string;
} | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch {
    return null;
  }
}

