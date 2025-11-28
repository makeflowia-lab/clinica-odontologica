import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit-log";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    const body = await request.json();
    const { apiKey, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify user matches token or is admin
    if (user.userId !== userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Rate Limiting: 5 updates per hour per user
    const isAllowed = await checkRateLimit(userId, "api-key-update", 5, 3600);
    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            "Has actualizado tu API key demasiadas veces. Intenta más tarde.",
        },
        { status: 429 }
      );
    }

    // Validate format
    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json({ error: "API key inválida" }, { status: 400 });
    }
    const encryptedKey = encrypt(apiKey);

    // Save to DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        openai_api_key_encrypted: encryptedKey,
        api_key_last_updated: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: "API_KEY_UPDATED",
      resource: "api_key",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const maskedKey = `sk-...${apiKey.slice(-4)}`;

    return NextResponse.json({
      success: true,
      message: "API key guardada de forma segura",
      maskedKey,
    });
  } catch (error) {
    console.error("Error saving API key:", error);
    return NextResponse.json(
      { error: "Error al guardar API key" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify user matches token or is admin
    if (user.userId !== userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { openai_api_key_encrypted: true },
    });

    if (userRecord?.openai_api_key_encrypted) {
      // Audit log for viewing
      await createAuditLog({
        userId,
        action: "API_KEY_VIEWED",
        resource: "api_key",
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      });

      return NextResponse.json({
        hasKey: true,
        maskedKey: "sk-...****",
      });
    }

    return NextResponse.json({
      hasKey: false,
    });
  } catch (error) {
    console.error("Error checking API key:", error);
    return NextResponse.json(
      { error: "Error al verificar API key" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify user matches token or is admin
    if (user.userId !== userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        openai_api_key_encrypted: null,
        api_key_last_updated: null,
      },
    });

    // Audit log
    await createAuditLog({
      userId,
      action: "API_KEY_DELETED",
      resource: "api_key",
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "API key eliminada",
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Error al eliminar API key" },
      { status: 500 }
    );
  }
}
