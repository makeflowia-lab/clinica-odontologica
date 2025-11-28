import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isTemporaryAdmin: true,
      },
    });

    console.log("\n=== USUARIOS EN LA BASE DE DATOS ===\n");
    users.forEach((user) => {
      console.log(`Email: ${user.email}`);
      console.log(`Nombre: ${user.firstName} ${user.lastName}`);
      console.log(`Rol: ${user.role}`);
      console.log(`Temporal: ${user.isTemporaryAdmin || false}`);
      console.log("---");
    });
    console.log(`\nTotal de usuarios: ${users.length}\n`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
