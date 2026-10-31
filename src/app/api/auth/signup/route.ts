import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PASSWORD_RULE, hashPassword, signToken } from "@/lib/auth";

const signupSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .regex(
      PASSWORD_RULE,
      "Password must be >8 chars with upper, lower, special"
    ),
  name: z.string().min(1).max(100),
});

export async function POST(req: Request) {
  // TODO: Add rate limiting in production (e.g., Upstash / Redis) to protect signup endpoint against abuse.
  try {
    const body = await req.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Role is HARDCODED to 'customer'. Signup can never create admin or staff.
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "customer",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 43200,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

