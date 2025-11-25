import { NextRequest, NextResponse } from "next/server";
import { hashPassword, comparePassword } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { z } from "zod";

const recoverySchema = z.object({
  email: z.string().email(),
  recoverySecret: z.string().min(6),
  newPassword: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = recoverySchema.parse(body);

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga una palabra secreta configurada
    if (!user.recoverySecret) {
      return NextResponse.json(
        {
          error:
            "Este usuario no tiene configurada una palabra secreta de recuperación",
        },
        { status: 400 }
      );
    }

    // Verificar la palabra secreta
    const isValidSecret = await comparePassword(
      data.recoverySecret,
      user.recoverySecret
    );

    if (!isValidSecret) {
      return NextResponse.json(
        { error: "Palabra secreta incorrecta" },
        { status: 401 }
      );
    }

    // Hashear la nueva contraseña
    const hashedPassword = await hashPassword(data.newPassword);

    // Actualizar la contraseña del usuario
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      {
        message: "Contraseña actualizada exitosamente",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Recovery error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al recuperar la cuenta" },
      { status: 500 }
    );
  }
}
