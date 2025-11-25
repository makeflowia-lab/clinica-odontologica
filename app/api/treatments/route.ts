import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { z } from 'zod';

const treatmentSchema = z.object({
  patientId: z.string().uuid(),
  dentistId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  tooth: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
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
    const token = extractTokenFromHeader(request.headers.get('authorization') || '');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (patientId) whereClause.patientId = patientId;
    if (status) whereClause.status = status;

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
        appointment: {
          select: {
            id: true,
            dateTime: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({ treatments });

  } catch (error) {
    console.error('Get treatments error:', error);
    return NextResponse.json(
      { error: 'Error al obtener tratamientos' },
      { status: 500 }
    );
  }
}

// POST: Create treatment
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization') || '');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    verifyToken(token);

    const body = await request.json();
    const data = treatmentSchema.parse(body);

    const treatment = await prisma.treatment.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        patient: true,
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
    console.error('Create treatment error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear tratamiento' },
      { status: 500 }
    );
  }
}

// PATCH: Update treatment
export async function PATCH(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization') || '');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
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
    });

    return NextResponse.json({ treatment });

  } catch (error: any) {
    console.error('Update treatment error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Tratamiento no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar tratamiento' },
      { status: 500 }
    );
  }
}
