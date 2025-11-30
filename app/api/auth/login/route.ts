import { NextRequest, NextResponse } from "next/server";
import { comparePassword, generateToken } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { getSubscription } from "@/lib/subscription";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Force email to lowercase
    if (body.email) {
      body.email = body.email.toLowerCase();
    }

    const data = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(data.password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Ensure subscription exists
    try {
      await getSubscription(user.tenantId);
    } catch (subError) {
      console.error("Error initializing subscription on login:", subError);
      // Continue login even if subscription check fails, but log it
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId, // Multi-tenancy
      clinicId: user.clinicId || undefined,
    });

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        ...userWithoutPassword,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
