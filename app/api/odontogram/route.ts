import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { z } from "zod";

const odontogramSchema = z.object({
  patientId: z.string(),
  clinicalRecordId: z.string().optional(),
  data: z.record(
    z.object({
      id: z.number().optional(),
      status: z.enum([
        "HEALTHY",
        "CAVITY",
        "FILLED",
        "CROWN",
        "MISSING",
        "IMPLANT",
        "ROOT_CANAL",
      ]),
      notes: z.string().optional(),
      surfaces: z
        .object({
          occlusal: z.enum([
            "HEALTHY",
            "CAVITY",
            "FILLED",
            "CROWN",
            "MISSING",
            "IMPLANT",
            "ROOT_CANAL",
          ]),
          mesial: z.enum([
            "HEALTHY",
            "CAVITY",
            "FILLED",
            "CROWN",
            "MISSING",
            "IMPLANT",
            "ROOT_CANAL",
          ]),
          distal: z.enum([
            "HEALTHY",
            "CAVITY",
            "FILLED",
            "CROWN",
            "MISSING",
            "IMPLANT",
            "ROOT_CANAL",
          ]),
          buccal: z.enum([
            "HEALTHY",
            "CAVITY",
            "FILLED",
            "CROWN",
            "MISSING",
            "IMPLANT",
            "ROOT_CANAL",
          ]),
          lingual: z.enum([
            "HEALTHY",
            "CAVITY",
            "FILLED",
            "CROWN",
            "MISSING",
            "IMPLANT",
            "ROOT_CANAL",
          ]),
        })
        .optional(),
    })
  ),
});

// GET: Get patient's odontogram
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

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID requerido" },
        { status: 400 }
      );
    }

    // Verify patient belongs to tenant
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Get the most recent odontogram
    const odontogram = await prisma.odontogram.findFirst({
      where: {
        patientId,
        tenantId: user.tenantId, // Enforce tenant isolation
      },
      orderBy: { createdAt: "desc" },
    });

    if (!odontogram) {
      return NextResponse.json({ odontogram: null });
    }

    return NextResponse.json({ odontogram });
  } catch (error) {
    console.error("Get odontogram error:", error);
    return NextResponse.json(
      { error: "Error al obtener odontograma" },
      { status: 500 }
    );
  }
}

// POST: Create or update odontogram
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
    const data = odontogramSchema.parse(body);

    // Check if patient exists and belongs to tenant
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, tenantId: user.tenantId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Create new odontogram
    const odontogram = await prisma.odontogram.create({
      data: {
        tenantId: user.tenantId, // Assign to tenant
        patientId: data.patientId,
        clinicalRecordId: data.clinicalRecordId || null,
        data: data.data,
      },
    });

    return NextResponse.json({ odontogram }, { status: 201 });
  } catch (error) {
    console.error("Create odontogram error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear odontograma" },
      { status: 500 }
    );
  }
}

// PATCH: Update odontogram
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

    // Verify odontogram belongs to tenant
    const existingOdontogram = await prisma.odontogram.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingOdontogram) {
      return NextResponse.json(
        { error: "Odontograma no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { data } = body;

    const odontogram = await prisma.odontogram.update({
      where: { id },
      data: { data },
    });

    return NextResponse.json({ odontogram });
  } catch (error: any) {
    console.error("Update odontogram error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Odontograma no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar odontograma" },
      { status: 500 }
    );
  }
}
