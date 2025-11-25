const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando citas en la base de datos...\n');
    
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        dentist: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        dateTime: 'desc'
      },
      take: 10
    });

    console.log(`Total de citas encontradas: ${appointments.length}\n`);
    
    if (appointments.length > 0) {
      appointments.forEach((apt: any, index: number) => {
        console.log(`${index + 1}. Cita ID: ${apt.id}`);
        console.log(`   Paciente: ${apt.patient.firstName} ${apt.patient.lastName}`);
        console.log(`   Dentista: Dr. ${apt.dentist.firstName} ${apt.dentist.lastName}`);
        console.log(`   Fecha/Hora: ${apt.dateTime}`);
        console.log(`   Estado: ${apt.status}`);
        console.log(`   Tipo: ${apt.type}`);
        console.log('');
      });
    } else {
      console.log('No hay citas en la base de datos.');
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
