// Script para verificar conexión con Neon y limpiar datos de prueba
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function verifyConnection() {
  console.log("🔍 Verificando conexión con Neon...\n");

  try {
    // Intentar hacer una consulta simple
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Conexión exitosa con la base de datos Neon!\n");
    return true;
  } catch (error) {
    console.error("❌ Error al conectar con Neon:");
    console.error(error);
    return false;
  }
}

async function showCurrentData() {
  console.log("📊 Datos actuales en la base de datos:\n");

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const patients = await prisma.patient.count();
    const appointments = await prisma.appointment.count();
    const treatments = await prisma.treatment.count();
    const clinicalRecords = await prisma.clinicalRecord.count();

    console.log(`👥 Usuarios: ${users.length}`);
    users.forEach((user) => {
      console.log(
        `   - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`
      );
    });

    console.log(`\n📋 Pacientes: ${patients}`);
    console.log(`📅 Citas: ${appointments}`);
    console.log(`💊 Tratamientos: ${treatments}`);
    console.log(`📝 Registros clínicos: ${clinicalRecords}\n`);
  } catch (error) {
    console.error("❌ Error al obtener datos:");
    console.error(error);
  }
}

async function cleanTestData() {
  console.log("🧹 Limpiando datos de prueba...\n");

  try {
    // Eliminar en orden correcto para respetar las relaciones
    console.log("Eliminando registros clínicos...");
    const deletedRecords = await prisma.clinicalRecord.deleteMany({});
    console.log(`✅ ${deletedRecords.count} registros clínicos eliminados`);

    console.log("Eliminando citas...");
    const deletedAppointments = await prisma.appointment.deleteMany({});
    console.log(`✅ ${deletedAppointments.count} citas eliminadas`);

    console.log("Eliminando tratamientos...");
    const deletedTreatments = await prisma.treatment.deleteMany({});
    console.log(`✅ ${deletedTreatments.count} tratamientos eliminados`);

    console.log("Eliminando pacientes...");
    const deletedPatients = await prisma.patient.deleteMany({});
    console.log(`✅ ${deletedPatients.count} pacientes eliminados`);

    console.log(
      "Eliminando usuarios de prueba (manteniendo admin@clinica.com)..."
    );
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          not: "admin@clinica.com", // Mantener el usuario admin
        },
      },
    });
    console.log(`✅ ${deletedUsers.count} usuarios eliminados\n`);

    console.log("✨ Base de datos limpia y lista para usar!\n");
  } catch (error) {
    console.error("❌ Error al limpiar datos:");
    console.error(error);
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  VERIFICACIÓN Y LIMPIEZA DE BASE DE DATOS - NEON");
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. Verificar conexión
  const isConnected = await verifyConnection();

  if (!isConnected) {
    console.log("\n⚠️  No se pudo conectar a la base de datos.");
    console.log(
      "Verifica tu archivo .env y asegúrate de que DATABASE_URL esté configurado correctamente.\n"
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  // 2. Mostrar datos actuales
  await showCurrentData();

  // 3. Preguntar si desea limpiar
  console.log("⚠️  ¿Deseas eliminar todos los datos de prueba?");
  console.log("   Se mantendrá el usuario admin@clinica.com\n");

  // Limpiar automáticamente (puedes comentar esta línea si quieres confirmación manual)
  await cleanTestData();

  // 4. Mostrar datos después de limpiar
  console.log("📊 Datos después de la limpieza:\n");
  await showCurrentData();

  await prisma.$disconnect();
  console.log("✅ Proceso completado!\n");
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
