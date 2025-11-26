import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
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

    // Verificar si existe un administrador temporal
    const tempAdmin = await prisma.user.findFirst({
      where: { isTemporaryAdmin: true },
    });

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Hash recovery secret if provided
    const hashedRecoverySecret = data.recoverySecret
      ? await hashPassword(data.recoverySecret)
      : null;

    let user;
    let replacedTempAdmin = false;

    if (tempAdmin) {
      // Reemplazar al administrador temporal con el nuevo usuario
      // Primero eliminar el admin temporal
      await prisma.user.delete({
        where: { id: tempAdmin.id },
      });

      // Crear el nuevo usuario como ADMIN (primer usuario real)
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          role: "ADMIN", // El primer usuario siempre es ADMIN
          phone: data.phone?.trim() || null,
          isTemporaryAdmin: false,
          recoverySecret: hashedRecoverySecret,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      });

      replacedTempAdmin = true;
    } else {
      // Crear usuario normal
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          role: data.role,
          phone: data.phone?.trim() || null,
          isTemporaryAdmin: false,
          recoverySecret: hashedRecoverySecret,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json(
      {
        message: replacedTempAdmin
          ? "Usuario registrado exitosamente como Administrador Principal"
          : "Usuario registrado exitosamente",
        user,
        isFirstUser: replacedTempAdmin,
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
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
