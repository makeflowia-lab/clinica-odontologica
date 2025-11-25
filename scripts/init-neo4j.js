// Script para inicializar la base de datos Neo4j
const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function initializeDatabase() {
  const session = driver.session();
  
  try {
    console.log('🔧 Inicializando base de datos Neo4j...\n');

    // Constraints para unicidad
    console.log('📌 Creando constraints...');
    
    await session.run(`
      CREATE CONSTRAINT user_email IF NOT EXISTS
      FOR (u:User) REQUIRE u.email IS UNIQUE
    `);
    console.log('  ✅ Constraint: User.email');
    
    await session.run(`
      CREATE CONSTRAINT patient_id IF NOT EXISTS
      FOR (p:Patient) REQUIRE p.id IS UNIQUE
    `);
    console.log('  ✅ Constraint: Patient.id');

    await session.run(`
      CREATE CONSTRAINT appointment_id IF NOT EXISTS
      FOR (a:Appointment) REQUIRE a.id IS UNIQUE
    `);
    console.log('  ✅ Constraint: Appointment.id');

    await session.run(`
      CREATE CONSTRAINT treatment_id IF NOT EXISTS
      FOR (t:Treatment) REQUIRE t.id IS UNIQUE
    `);
    console.log('  ✅ Constraint: Treatment.id');

    await session.run(`
      CREATE CONSTRAINT material_id IF NOT EXISTS
      FOR (m:Material) REQUIRE m.id IS UNIQUE
    `);
    console.log('  ✅ Constraint: Material.id');

    await session.run(`
      CREATE CONSTRAINT invoice_id IF NOT EXISTS
      FOR (i:Invoice) REQUIRE i.id IS UNIQUE
    `);
    console.log('  ✅ Constraint: Invoice.id');

    // Índices para búsquedas frecuentes
    console.log('\n🔍 Creando índices...');
    
    await session.run(`
      CREATE INDEX patient_name_idx IF NOT EXISTS
      FOR (p:Patient) ON (p.firstName, p.lastName)
    `);
    console.log('  ✅ Index: Patient.firstName, Patient.lastName');

    await session.run(`
      CREATE INDEX patient_phone_idx IF NOT EXISTS
      FOR (p:Patient) ON (p.phone)
    `);
    console.log('  ✅ Index: Patient.phone');

    await session.run(`
      CREATE INDEX appointment_date_idx IF NOT EXISTS
      FOR (a:Appointment) ON (a.dateTime)
    `);
    console.log('  ✅ Index: Appointment.dateTime');

    await session.run(`
      CREATE INDEX material_category_idx IF NOT EXISTS
      FOR (m:Material) ON (m.category)
    `);
    console.log('  ✅ Index: Material.category');

    // Crear usuario administrador de prueba
    console.log('\n👤 Creando usuario administrador de prueba...');
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const result = await session.run(`
      MERGE (u:User {email: 'admin@clinica.com'})
      ON CREATE SET
        u.id = randomUUID(),
        u.password = $password,
        u.firstName = 'Admin',
        u.lastName = 'Sistema',
        u.role = 'ADMIN',
        u.createdAt = datetime(),
        u.updatedAt = datetime()
      RETURN u
    `, { password: hashedPassword });

    if (result.records.length > 0) {
      console.log('  ✅ Usuario: admin@clinica.com / admin123');
    }

    // Crear datos de ejemplo (opcional)
    console.log('\n📦 Creando datos de ejemplo...');

    // Materiales de ejemplo
    await session.run(`
      MERGE (m1:Material {id: 'mat-001'})
      ON CREATE SET
        m1.name = 'Composite A2',
        m1.category = 'FILLING',
        m1.brand = 'Dental Corp',
        m1.unitPrice = 45.00,
        m1.stockQuantity = 25,
        m1.minStockLevel = 10,
        m1.createdAt = datetime(),
        m1.updatedAt = datetime()
      
      MERGE (m2:Material {id: 'mat-002'})
      ON CREATE SET
        m2.name = 'Corona Porcelana',
        m2.category = 'CROWN',
        m2.brand = 'Premium Dental',
        m2.unitPrice = 250.00,
        m2.stockQuantity = 8,
        m2.minStockLevel = 5,
        m2.createdAt = datetime(),
        m2.updatedAt = datetime()
      
      MERGE (m3:Material {id: 'mat-003'})
      ON CREATE SET
        m3.name = 'Guantes Latex (caja)',
        m3.category = 'CONSUMABLE',
        m3.unitPrice = 15.00,
        m3.stockQuantity = 50,
        m3.minStockLevel = 20,
        m3.createdAt = datetime(),
        m3.updatedAt = datetime()
    `);
    console.log('  ✅ Materiales de ejemplo creados');

    console.log('\n✅ Base de datos inicializada correctamente!\n');
    console.log('📝 Resumen:');
    console.log('  - Constraints: 6');
    console.log('  - Índices: 4');
    console.log('  - Usuario admin: admin@clinica.com / admin123');
    console.log('  - Materiales: 3\n');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Proceso completado. Puedes ejecutar `npm run dev` ahora.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
