import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: true,
          message: "If this email exists, a reset link has been sent",
        },
        { status: 200 }
      );
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Prevent token sprawl by deleting existing unused tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          used: false,
        },
      });

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
          used: false,
        },
      });

      const baseUrl = process.env.APP_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // Log only user id, never the full email
      console.log(`[MAIL] Password reset requested for userId: ${user.id}`);
      // TODO: Replace with production transactional email provider (e.g. Resend)
      console.log("[MAIL] Reset URL:", resetUrl);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "If this email exists, a reset link has been sent",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: true,
        message: "If this email exists, a reset link has been sent",
      },
      { status: 200 }
    );
  }
}

