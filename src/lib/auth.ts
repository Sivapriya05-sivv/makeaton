import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = 10;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET environment variable is missing in production."
      );
    }
    return "dev-only-secret-do-not-use-in-prod";
  }
  return secret;
};

export const JWT_SECRET = getJwtSecret();

export const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

export interface AuthPayload {
  id: number;
  role: string;
  email: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyToken(
  token: string
): { id: number; role: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof decoded.id === "number" &&
      typeof decoded.role === "string" &&
      typeof decoded.email === "string"
    ) {
      return {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

