import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { PLAN_CONFIGS } from "@/lib/subscription-plans";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "DENTIST", "RECEPTIONIST"]),
  phone: z.string().optional(),
  recoverySecret: z.string().min(6).optional(), // Palabra secreta para recuperación
});

const DEFAULT_TIMEZONE = "America/Mexico_City";
const DEFAULT_CURRENCY = "MXN";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

async function createUniqueTenantSlug(base: string) {
  const seed = slugify(base || "clinica");
  let candidate = seed;
  let tries = 0;

  while (true) {
    if (tries > 0) {
      candidate = `${seed}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const existing = await prisma.tenant.findUnique({
      where: { slug: candidate },
    });

    if (!existing) break;
    tries += 1;
  }

  return candidate;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the incoming data for debugging
    console.log("Registration attempt with data:", {
      ...body,
      password: "[REDACTED]",
      recoverySecret: body.recoverySecret ? "[REDACTED]" : undefined,
    });

    const data = registerSchema.parse(body);

    // Additional validation to ensure no undefined values
    if (
      !data.email ||
      !data.password ||
      !data.firstName ||
      !data.lastName ||
      !data.role
    ) {
      return NextResponse.json(
        { error: "Todos los campos requeridos deben estar completos" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Hash recovery secret if provided
    const hashedRecoverySecret = data.recoverySecret
      ? await hashPassword(data.recoverySecret)
      : null;

    const tenantName =
      `${data.firstName} ${data.lastName}`.trim() || data.email.split("@")[0];

    const tenantSlug = await createUniqueTenantSlug(tenantName);

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        isActive: true,
        settings: {
          timezone: DEFAULT_TIMEZONE,
          currency: DEFAULT_CURRENCY,
        },
      },
    });

    const planConfig = PLAN_CONFIGS[SubscriptionPlan.STARTER];
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planType: SubscriptionPlan.STARTER,
        status: SubscriptionStatus.TRIAL,
        maxPatients: planConfig.maxPatients,
        maxUsers: planConfig.maxUsers,
        aiQueriesLimit: planConfig.aiQueriesLimit,
        aiQueriesUsed: 0,
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        role: "ADMIN",
        phone: data.phone?.trim() || null,
        isTemporaryAdmin: false,
        recoverySecret: hashedRecoverySecret,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
        tenantId: true,
      },
    });

    return NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user,
        tenantId: tenant.id,
        isFirstUser: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: `Error al registrar usuario: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
