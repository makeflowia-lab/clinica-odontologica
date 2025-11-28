const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTenant() {
  try {
    // Check if tenant exists
    const tenantCount = await prisma.tenant.count();

    if (tenantCount > 0) {
      console.log("✅ Ya existe un tenant en la base de datos");
      const tenants = await prisma.tenant.findMany();
      tenants.forEach((t) => {
        console.log(`  - ${t.name} (${t.slug})`);
      });
      return;
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: "Clínica Dental Principal",
        slug: "clinica-principal",
        isActive: true,
        settings: {
          timezone: "America/Mexico_City",
          currency: "MXN",
        },
      },
    });

    console.log("✅ Tenant creado exitosamente:");
    console.log(`   Nombre: ${tenant.name}`);
    console.log(`   Slug: ${tenant.slug}`);
    console.log(`   ID: ${tenant.id}`);
    console.log(
      "\n✨ Ahora puedes registrar tu primer usuario como administrador"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTenant();
