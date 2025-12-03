import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuario de prueba...');
  
  const existingUser = await prisma.user.findUnique({
    where: { email: 'prueba@clinica.com' },
    include: {
      tenant: {
        include: {
          subscription: true
        }
      }
    }
  });
  
  if (existingUser) {
    console.log('✅ Usuario encontrado:', existingUser.email);
    console.log('📋 Tenant:', existingUser.tenant.name);
    console.log('💳 Suscripción:', existingUser.tenant.subscription?.planType, existingUser.tenant.subscription?.status);
    console.log('📅 Trial hasta:', existingUser.tenant.subscription?.trialEndsAt?.toLocaleDateString());
    return;
  }
  
  console.log('❌ Usuario no encontrado. Creando configuración completa...');
  
  // 1. Crear Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Clínica de Prueba',
      slug: 'clinica-prueba',
      isActive: true,
    },
  });
  console.log('✅ Tenant creado:', tenant.name);
  
  // 2. Crear Usuario Admin
  const hashedPassword = await bcrypt.hash('Prueba123!', 10);
  const newUser = await prisma.user.create({
    data: {
      email: 'prueba@clinica.com',
      password: hashedPassword,
      firstName: 'Usuario',
      lastName: 'Prueba',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Usuario creado:', newUser.email);
  
  // 3. Crear Suscripción con Trial de 14 días
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  
  const subscription = await prisma.subscription.create({
    data: {
      tenantId: tenant.id,
      planType: 'STARTER',
      status: 'TRIAL',
      maxPatients: 100,
      maxUsers: 1,
      aiQueriesLimit: 50,
      aiQueriesUsed: 0,
      trialEndsAt: trialEndsAt,
      currentPeriodEnd: periodEnd,
    },
  });
  console.log('✅ Suscripción creada: Plan', subscription.planType, 'con trial hasta', trialEndsAt.toLocaleDateString());
  console.log('\n🎉 ¡Configuración completa!');
  console.log('📧 Email: prueba@clinica.com');
  console.log('🔑 Password: Prueba123!');
  console.log('⏰ Trial: 14 días gratuitos');
  console.log('📊 Límites: 100 pacientes, 1 usuario, 50 consultas IA');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
