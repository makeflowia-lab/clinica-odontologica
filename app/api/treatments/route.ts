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
