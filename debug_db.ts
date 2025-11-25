
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to DB...');
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log(`- ${u.email} (${u.role}) ID: ${u.id}`);
    });
  } catch (e) {
    console.error('DB Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
