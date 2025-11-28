import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const userAdmin = verifyToken(token);

    const body = await request.json();
    const { firstName, lastName, email, phone, role, password } = body;
    if (!firstName || !lastName || !email || !phone || !role || !password) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Validar que el rol sea válido
    if (!["ADMIN", "DENTIST", "ASSISTANT"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    // Verificar si el email ya existe
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 409 }
      );
    }

    // Hashear contraseña proporcionada
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        tenantId: userAdmin.tenantId, // Assign to tenant
        firstName,
        lastName,
        email,
        phone,
        role,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
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

    // Return ALL users for this tenant
    const users = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId, // Enforce tenant isolation
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ dentists: users }); // Keep same response structure for compatibility
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
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

    // Only ADMIN can delete users
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Prevent deleting yourself
    if (id === user.userId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 400 }
      );
    }

    // Verify user belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Usuario eliminado exitosamente" });
  } catch (error: any) {
    console.error("Error deleting user:", error);

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el usuario porque tiene pacientes, citas o historiales asociados.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
