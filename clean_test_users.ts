const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanUsers() {
  try {
    const deleted = await prisma.user.deleteMany({
      where: {
        email: {
          in: ["admin@gmail.com", "admin_full@gmail.com"],
        },
      },
    });
    console.log(`Deleted ${deleted.count} test users.`);
  } catch (error) {
    console.error("Error cleaning users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanUsers();
