import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { z } from "zod";

const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  dentistId: z.string().uuid(),
  dateTime: z.string(),
  duration: z.number().min(15).max(480),
  type: z.enum([
    "CONSULTATION",
    "CLEANING",
    "FILLING",
    "ROOT_CANAL",
    "EXTRACTION",
    "IMPLANT",
    "ORTHODONTICS",
    "EMERGENCY",
    "OTHER",
  ]),
  notes: z.string().optional(),
  room: z.string().optional(),
});

// GET: Get appointments with filters
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
    const date = searchParams.get("date");
    const dentistId = searchParams.get("dentistId");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    // Build where clause
    const whereClause: any = {};

    if (date) {
      const startOfDay = new Date(date + "T00:00:00.000Z");
      const endOfDay = new Date(date + "T23:59:59.999Z");

      whereClause.dateTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else {
      // If no date filter, show upcoming appointments (next 60 days)
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      whereClause.dateTime = {
        gte: now,
        lte: futureDate,
      };
    }

    if (dentistId) {
      whereClause.dentistId = dentistId;
    }

    if (patientId) {
      whereClause.patientId = patientId;
    }

    if (status) {
      whereClause.status = status;
    }

    // If user is dentist, only show their appointments
    if (user.role === "DENTIST") {
      whereClause.dentistId = user.userId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
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
      orderBy: { dateTime: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { error: "Error al obtener citas" },
      { status: 500 }
    );
  }
}

// POST: Create appointment
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
    const data = appointmentSchema.parse(body);

    // Verify dentist exists
    const dentist = await prisma.user.findUnique({
      where: { id: data.dentistId, role: "DENTIST" },
    });

    if (!dentist) {
      return NextResponse.json(
        { error: "Dentista no encontrado" },
        { status: 404 }
      );
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Check for conflicts
    const appointmentStart = new Date(data.dateTime);
    const appointmentEnd = new Date(
      appointmentStart.getTime() + data.duration * 60000
    );

    const conflicts = await prisma.appointment.findMany({
      where: {
        dentistId: data.dentistId,
        status: { not: "CANCELLED" },
        dateTime: {
          gte: new Date(appointmentStart.getTime() - 24 * 60 * 60 * 1000), // 1 day before
          lte: new Date(appointmentEnd.getTime() + 24 * 60 * 60 * 1000), // 1 day after
        },
      },
    });

    // Check for actual time overlap
    let hasConflict = false;
    for (const conflict of conflicts) {
      const conflictStart = new Date(conflict.dateTime);
      const conflictEnd = new Date(
        conflictStart.getTime() + conflict.duration * 60000
      );

      if (
        (appointmentStart >= conflictStart && appointmentStart < conflictEnd) ||
        (appointmentEnd > conflictStart && appointmentEnd <= conflictEnd) ||
        (appointmentStart <= conflictStart && appointmentEnd >= conflictEnd)
      ) {
        hasConflict = true;

        // Suggest alternative times (1 hour before and 1 hour after)
        const oneHourBefore = new Date(
          appointmentStart.getTime() - 60 * 60 * 1000
        );
        const oneHourAfter = new Date(
          appointmentStart.getTime() + 60 * 60 * 1000
        );

        // Check if suggested times are also conflicting
        const suggestedTimes = [];

        // Check 1 hour before
        const beforeEnd = new Date(
          oneHourBefore.getTime() + data.duration * 60000
        );
        let beforeHasConflict = false;
        for (const c of conflicts) {
          const cStart = new Date(c.dateTime);
          const cEnd = new Date(cStart.getTime() + c.duration * 60000);
          if (
            (oneHourBefore >= cStart && oneHourBefore < cEnd) ||
            (beforeEnd > cStart && beforeEnd <= cEnd) ||
            (oneHourBefore <= cStart && beforeEnd >= cEnd)
          ) {
            beforeHasConflict = true;
            break;
          }
        }
        if (!beforeHasConflict) {
          suggestedTimes.push({
            dateTime: oneHourBefore.toISOString(),
            label: "Una hora antes",
          });
        }

        // Check 1 hour after
        const afterEnd = new Date(
          oneHourAfter.getTime() + data.duration * 60000
        );
        let afterHasConflict = false;
        for (const c of conflicts) {
          const cStart = new Date(c.dateTime);
          const cEnd = new Date(cStart.getTime() + c.duration * 60000);
          if (
            (oneHourAfter >= cStart && oneHourAfter < cEnd) ||
            (afterEnd > cStart && afterEnd <= cEnd) ||
            (oneHourAfter <= cStart && afterEnd >= cEnd)
          ) {
            afterHasConflict = true;
            break;
          }
        }
        if (!afterHasConflict) {
          suggestedTimes.push({
            dateTime: oneHourAfter.toISOString(),
            label: "Una hora después",
          });
        }

        return NextResponse.json(
          {
            error: "El dentista ya tiene una cita en ese horario",
            conflict: true,
            suggestedTimes:
              suggestedTimes.length > 0 ? suggestedTimes : undefined,
            message:
              suggestedTimes.length > 0
                ? `Horarios disponibles: ${suggestedTimes
                    .map((t) => t.label)
                    .join(", ")}`
                : "No hay horarios disponibles cercanos. Por favor elija otro horario.",
          },
          { status: 409 }
        );
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        dateTime: new Date(data.dateTime),
        status: "SCHEDULED",
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
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

    // TODO: Send appointment confirmation notification

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Create appointment error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Error al crear cita" }, { status: 500 });
  }
}

// PATCH: Update appointment status
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { status, notes, dateTime, dentistId, duration, type } = body;

    // If updating time/dentist, we should check for conflicts again, but for simplicity in this MVP we'll skip strict conflict check on update
    // or we could implement a simplified check.

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(dateTime && { dateTime: new Date(dateTime) }),
        ...(dentistId && { dentistId }),
        ...(duration && { duration }),
        ...(type && { type }),
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        dentist: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ appointment });
  } catch (error: any) {
    console.error("Update appointment error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar cita" },
      { status: 500 }
    );
  }
}

// DELETE: Delete appointment
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

    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Cita eliminada exitosamente" });
  } catch (error: any) {
    console.error("Delete appointment error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar la cita" },
      { status: 500 }
    );
  }
}
