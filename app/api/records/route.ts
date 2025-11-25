import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { z } from "zod";

const recordSchema = z.object({
  patientId: z.string().min(1),
  dentistId: z.string().min(1),
  date: z.string(),
  type: z.string(),
  diagnosis: z.string().min(1),
  treatment: z.string().min(1),
  notes: z.string().optional(),
});

// GET: List clinical records
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const patientId = searchParams.get("patientId");

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { diagnosis: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (type && type !== "all") {
      whereClause.type = type;
    }

    if (patientId) {
      whereClause.patientId = patientId;
    }

    const records = await prisma.clinicalRecord.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        dentist: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const formattedRecords = records.map((record) => ({
      id: record.id,
      patientId: record.patientId,
      patientName: `${record.patient.firstName} ${record.patient.lastName}`,
      date: record.date.toISOString(),
      type: record.type,
      diagnosis: record.diagnosis || "",
      treatment: record.treatmentPlan || "", // Mapping treatmentPlan to treatment
      notes: record.notes,
      dentist: `${record.dentist.firstName} ${record.dentist.lastName}`,
    }));

    return NextResponse.json({ records: formattedRecords });
  } catch (error) {
    console.error("Get records error:", error);
    return NextResponse.json(
      { error: "Error al obtener historiales clínicos" },
      { status: 500 }
    );
  }
}

// POST: Create clinical record
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    verifyToken(token);

    const body = await request.json();
    const data = recordSchema.parse(body);

    const record = await prisma.clinicalRecord.create({
      data: {
        patientId: data.patientId,
        dentistId: data.dentistId,
        date: new Date(data.date),
        type: data.type,
        diagnosis: data.diagnosis,
        treatmentPlan: data.treatment, // Mapping treatment to treatmentPlan
        notes: data.notes || "",
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Create record error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear historial clínico" },
      { status: 500 }
    );
  }
}

// DELETE: Delete clinical record
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Use a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // First, delete any associated odontogram (or set to null if you prefer to keep it)
      // Assuming we want to delete the snapshot if the record is deleted
      await tx.odontogram.deleteMany({
        where: { clinicalRecordId: id },
      });

      // Then delete the clinical record
      await tx.clinicalRecord.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: "Historial clínico eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Delete record error:", error);
    // Return more specific error if possible
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el registro porque tiene datos relacionados.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al eliminar historial clínico" },
      { status: 500 }
    );
  }
}
