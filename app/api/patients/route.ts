import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth"; // Asegúrate de tener estas funciones
import { checkSubscriptionLimit } from "@/lib/subscription";

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(["M", "F", "OTHER"]),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Restauré la validación del token en todos los métodos (GET, POST, PUT, DELETE)

// GET: List patients or get single patient
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
    const id = searchParams.get("id");

    // If ID is provided, return single patient
    if (id) {
      const patient = await prisma.patient.findFirst({
        where: {
          id,
          tenantId: user.tenantId, // Enforce tenant isolation
        },
        include: {
          appointments: {
            orderBy: { dateTime: "desc" },
            take: 10,
          },
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Paciente no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ patient });
    }

    // Otherwise list patients with pagination
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Build where clause for search
    const whereClause: any = {
      tenantId: user.tenantId, // Enforce tenant isolation
    };

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];
    }

    // Get patients with pagination
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          city: true,
          createdAt: true,
          updatedAt: true,
          appointments: {
            select: {
              dateTime: true,
              status: true,
            },
            orderBy: {
              dateTime: "desc",
            },
            take: 5, // Get last 5 to find recent and next
          },
        },
      }),
      prisma.patient.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      patients,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json(
      { error: "Error al obtener pacientes" },
      { status: 500 }
    );
  }
}

// POST: Create new patient
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    // Check subscription limits
    const limitCheck = await checkSubscriptionLimit(user.tenantId, "patients");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message, code: "LIMIT_REACHED" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = patientSchema.parse(body);

    const patient = await prisma.patient.create({
      data: {
        ...data,
        tenantId: user.tenantId, // Assign to tenant
        email: data.email || null,
        dateOfBirth: new Date(data.dateOfBirth),
        allergies: data.allergies || [],
        medicalConditions: data.medicalConditions || [],
        medications: data.medications || [],
        createdById: user.userId,
      },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Error al crear paciente",
        details: (error as Error).message,
        code: (error as any).code,
      },
      { status: 500 }
    );
  }
}

// PUT: Update patient
export async function PUT(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const body = await request.json();
    const data = patientSchema.partial().parse(body);

    // Verify patient belongs to tenant
    const existingPatient = await prisma.patient.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...data,
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
      },
    });

    return NextResponse.json({ patient });
  } catch (error: any) {
    console.error("Update patient error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar paciente" },
      { status: 500 }
    );
  }
}

// DELETE: Delete patient
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    // Only ADMIN can delete patients
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Verify patient belongs to tenant
    const existingPatient = await prisma.patient.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Paciente eliminado exitosamente" });
  } catch (error: any) {
    console.error("Delete patient error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar paciente" },
      { status: 500 }
    );
  }
}
