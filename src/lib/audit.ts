import { prisma } from "@/lib/prisma";

export async function logStateChange(params: {
  userId: number;
  entity: "subscription" | "invoice";
  entityId: number;
  fromState: string | null;
  toState: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        entity: params.entity,
        entityId: params.entityId,
        fromState: params.fromState,
        toState: params.toState,
      },
    });
  } catch (error) {
    console.error(
      `[AUDIT_LOG_ERROR] Failed to log state change for ${params.entity} #${params.entityId}:`,
      error
    );
  }
}
