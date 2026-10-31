import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { PASSWORD_RULE, hashPassword } from "@/lib/auth";

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .regex(
      PASSWORD_RULE,
      "Password must be >8 chars with upper, lower, special"
    ),
  name: z.string().min(1).max(100),
});

export async function GET() {
  try {
    await requireRole("admin");

    const staff = await prisma.user.findMany({
      where: { role: "staff" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireRole("admin");

    const body = await req.json();
    const validation = createStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // role is HARDCODED to 'staff'. Never accept role from body.
    const staffMember = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "staff",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(staffMember, { status: 201 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

