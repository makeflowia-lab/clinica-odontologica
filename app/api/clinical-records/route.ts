
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { z } from 'zod';

const recordSchema = z.object({
  patientName: z.string().min(1), // We'll need to find patient by name or pass patientId
  date: z.string(),
  type: z.enum(['consultation', 'treatment', 'surgery', 'followup']),
  diagnosis: z.string().min(1),
  treatment: z.string().min(1), // Maps to treatmentPlan
  notes: z.string().optional(),
  dentist: z.string().min(1), // We'll need to find dentist by name or pass dentistId
});

// GET: List records
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization') || '');
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { diagnosis: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    const records = await prisma.clinicalRecord.findMany({
      where: whereClause,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        dentist: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Transform to match frontend interface
    const formattedRecords = records.map(r => ({
      id: r.id,
      patientId: r.patientId,
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      date: r.date.toISOString().split('T')[0],
      type: r.type,
      diagnosis: r.diagnosis || '',
      treatment: r.treatmentPlan || '',
      notes: r.notes,
      dentist: `${r.dentist.firstName} ${r.dentist.lastName}`,
    }));

    return NextResponse.json({ records: formattedRecords });

  } catch (error) {
    console.error('Get records error:', error);
    return NextResponse.json({ error: 'Error al obtener historiales' }, { status: 500 });
  }
}

// POST: Create record
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization') || '');
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const user = verifyToken(token);

    const body = await request.json();
    const data = recordSchema.parse(body);

    // Find patient by name (fuzzy match) or create if not exists? 
    // Ideally frontend should send patientId. For now, let's try to find by name split
    // This is risky. Better to update frontend to send patientId.
    // But to keep it simple with current frontend form:
    
    // Let's assume frontend sends patientName. We try to find a patient.
    // If not found, we return error saying "Patient not found".
    
    const nameParts = data.patientName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    let patient = await prisma.patient.findFirst({
      where: {
        firstName: { contains: firstName, mode: 'insensitive' },
        OR: [
            { lastName: { contains: lastName || '', mode: 'insensitive' } }
        ]
      }
    });

    if (!patient) {
        // Fallback: try to find just by first name if last name is empty
        patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { firstName: { contains: data.patientName, mode: 'insensitive' } },
                    { lastName: { contains: data.patientName, mode: 'insensitive' } }
                ]
            }
        });
    }

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado. Verifique el nombre.' }, { status: 404 });
    }

    // Create record
    const record = await prisma.clinicalRecord.create({
      data: {
        patientId: patient.id,
        dentistId: user.userId, // Assign to current user (dentist)
        date: new Date(data.date),
        type: data.type,
        diagnosis: data.diagnosis,
        treatmentPlan: data.treatment,
        notes: data.notes || '',
      },
    });

    return NextResponse.json({ record }, { status: 201 });

  } catch (error) {
    console.error('Create record error:', error);
    return NextResponse.json({ error: 'Error al crear historial' }, { status: 500 });
  }
}

// DELETE: Delete record
export async function DELETE(request: NextRequest) {
    try {
      const token = extractTokenFromHeader(request.headers.get('authorization') || '');
      if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      verifyToken(token);
  
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
  
      if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  
      await prisma.clinicalRecord.delete({
        where: { id },
      });
  
      return NextResponse.json({ message: 'Historial eliminado' });
  
    } catch (error) {
      console.error('Delete record error:', error);
      return NextResponse.json({ error: 'Error al eliminar historial' }, { status: 500 });
    }
  }
