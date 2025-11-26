import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuditLogData {
  userId: string;
  action:
    | "API_KEY_CREATED"
    | "API_KEY_UPDATED"
    | "API_KEY_DELETED"
    | "API_KEY_VIEWED";
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

/**
 * Creates an audit log entry for security-sensitive operations
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        metadata: data.metadata || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Retrieves audit logs for a specific user
 */
export async function getAuditLogs(userId: string, limit: number = 50) {
  try {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error);
    return [];
  }
}

/**
 * Retrieves all audit logs (admin only)
 */
export async function getAllAuditLogs(limit: number = 100) {
  try {
    return await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error);
    return [];
  }
}
