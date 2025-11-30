import {
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando configuración de usuario de prueba...");

  const email = "prueba@clinica.com";
  const password = "Prueba123!";
  const tenantName = "Clínica de Prueba";

  // 1. Limpiar datos previos si existen
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log("🗑️  Eliminando usuario anterior...");
    await prisma.tenant.delete({ where: { id: existingUser.tenantId } });
  }

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: "clinica-prueba" },
  });
  if (existingTenant) {
    console.log("🗑️  Eliminando tenant anterior por slug...");
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
  }

  // 2. Crear Tenant
  console.log("🏥 Creando clínica...");
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: "clinica-prueba",
      isActive: true,
    },
  });

  // 3. Crear Usuario
  console.log("👤 Creando usuario administrador...");
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: "Usuario",
      lastName: "Prueba",
      role: "ADMIN",
      tenantId: tenant.id,
    },
  });

  // 4. Crear Suscripción STARTER con límites ALCANZADOS
  console.log("💳 Asignando Plan Starter con límites llenos...");

  // Calcular fechas
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planType: SubscriptionPlan.STARTER,
      status: SubscriptionStatus.ACTIVE,

      // Límites del plan Starter
      maxPatients: 100,
      maxUsers: 1,
      aiQueriesLimit: 50,

      // SIMULACIÓN: Llenamos el uso al máximo
      aiQueriesUsed: 50, // 50/50 usado -> Debe bloquear la siguiente

      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  console.log("\n✅ ¡Configuración completada exitosamente!");
  console.log("------------------------------------------------");
  console.log("📧 Email:    " + email);
  console.log("🔑 Password: " + password);
  console.log("------------------------------------------------");
  console.log("📝 Escenario de Prueba:");
  console.log("   - Plan: Starter");
  console.log("   - Consultas IA: 50/50 (Límite alcanzado)");
  console.log("   - Intenta usar el comando de voz -> Debería fallar.");
  console.log("   - Ve a Dashboard > Suscripción -> Verás la barra roja.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
