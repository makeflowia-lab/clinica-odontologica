import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log("🔍 Verificando usuarios en la base de datos...\n");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isTemporaryAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📊 Total de usuarios: ${users.length}\n`);

    if (users.length === 0) {
      console.log("❌ No hay usuarios en la base de datos");
    } else {
      console.log("✅ Usuarios encontrados:\n");
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Teléfono: ${user.phone || "No especificado"}`);
        console.log(
          `   Admin Temporal: ${user.isTemporaryAdmin ? "Sí" : "No"}`
        );
        console.log(`   Creado: ${user.createdAt.toLocaleString("es-MX")}`);
        console.log("");
      });
    }

    // Verificar pacientes
    const patients = await prisma.patient.count();
    console.log(`👥 Total de pacientes: ${patients}`);

    // Verificar citas
    const appointments = await prisma.appointment.count();
    console.log(`📅 Total de citas: ${appointments}`);

    // Verificar facturas
    const invoices = await prisma.invoice.count();
    console.log(`💰 Total de facturas: ${invoices}`);
  } catch (error) {
    console.error("❌ Error al verificar la base de datos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
