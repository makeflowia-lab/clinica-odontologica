import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { z } from "zod";

const treatmentSchema = z.object({
  patientId: z.string().uuid(),
  dentistId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  tooth: z.string().optional(),
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .default("PLANNED"),
  startDate: z.string(),
  endDate: z.string().optional(),
  cost: z.number().positive(),
  paid: z.number().min(0).default(0),
  notes: z.string().optional(),
  complications: z.string().optional(),
});

// GET: List treatments
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
    const patientId = searchParams.get("patientId");
    const dentistId = searchParams.get("dentistId");
    const status = searchParams.get("status");

    // Build where clause with tenantId
    const whereClause: any = {
      tenantId: user.tenantId, // Enforce tenant isolation
    };

    if (patientId) whereClause.patientId = patientId;
    if (dentistId) whereClause.dentistId = dentistId;
    if (status) whereClause.status = status;

    // If user is dentist, only show their treatments
    if (user.role === "DENTIST") {
      whereClause.dentistId = user.userId;
    }

    const treatments = await prisma.treatment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        dentist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ treatments });
  } catch (error) {
    console.error("Get treatments error:", error);
    return NextResponse.json(
      { error: "Error al obtener tratamientos" },
      { status: 500 }
    );
  }
}

// POST: Create treatment
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
    const data = treatmentSchema.parse(body);

    // Verify patient exists and belongs to tenant
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        tenantId: user.tenantId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Verify dentist exists and belongs to tenant
    const dentist = await prisma.user.findFirst({
      where: {
        id: data.dentistId,
        role: "DENTIST",
        tenantId: user.tenantId,
      },
    });

    if (!dentist) {
      return NextResponse.json(
        { error: "Dentista no encontrado" },
        { status: 404 }
      );
    }

    const treatment = await prisma.treatment.create({
      data: {
        ...data,
        tenantId: user.tenantId, // Assign to tenant
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        dentist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ treatment }, { status: 201 });
  } catch (error) {
    console.error("Create treatment error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear tratamiento" },
      { status: 500 }
    );
  }
}

// PATCH: Update treatment
export async function PATCH(request: NextRequest) {
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

    // Verify treatment belongs to tenant
    const existingTreatment = await prisma.treatment.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingTreatment) {
      return NextResponse.json(
        { error: "Tratamiento no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = treatmentSchema.partial().parse(body);

    const treatment = await prisma.treatment.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        dentist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ treatment });
  } catch (error: any) {
    console.error("Update treatment error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Tratamiento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar tratamiento" },
      { status: 500 }
    );
  }
}

// DELETE: Delete treatment
export async function DELETE(request: NextRequest) {
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

    // Verify treatment belongs to tenant before deleting
    const existingTreatment = await prisma.treatment.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingTreatment) {
      return NextResponse.json(
        { error: "Tratamiento no encontrado" },
        { status: 404 }
      );
    }

    await prisma.treatment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Tratamiento eliminado exitosamente" });
  } catch (error: any) {
    console.error("Delete treatment error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Tratamiento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar tratamiento" },
      { status: 500 }
    );
  }
}
