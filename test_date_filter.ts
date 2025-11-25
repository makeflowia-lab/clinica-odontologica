const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDateFilter() {
  const date = '2025-11-21';
  
  console.log('Testing date filter for:', date);
  console.log('');
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  console.log('Start of day:', startOfDay);
  console.log('End of day:', endOfDay);
  console.log('');
  
  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: startOfDay,
        lte: endOfDay,
      }
    },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });
  
  console.log(`Found ${appointments.length} appointments`);
  
  if (appointments.length > 0) {
    appointments.forEach((apt: any) => {
      console.log(`- ${apt.patient.firstName} ${apt.patient.lastName} at ${apt.dateTime}`);
    });
  }
  
  await prisma.$disconnect();
}

testDateFilter();
