/**
 * 🔒 SCRIPT DE VERIFICACIÓN DE SALUD DEL SISTEMA
 * 
 * Este script verifica que todos los componentes críticos del SaaS estén funcionando.
 * Ejecutar ANTES y DESPUÉS de cualquier cambio importante.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface HealthCheck {
  component: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
}

const results: HealthCheck[] = [];

async function checkDatabase() {
  console.log('🔍 Verificando base de datos...');
  
  try {
    // Verificar conexión
    await prisma.$connect();
    results.push({
      component: 'Database Connection',
      status: 'OK',
      message: 'Conexión establecida correctamente'
    });

    // Verificar tabla tenants
    const tenantsCount = await prisma.tenant.count();
    results.push({
      component: 'Tenants Table',
      status: tenantsCount > 0 ? 'OK' : 'WARNING',
      message: `${tenantsCount} tenant(s) encontrado(s)`
    });

    // Verificar tabla subscriptions
    const subscriptionsCount = await prisma.subscription.count();
    results.push({
      component: 'Subscriptions Table',
      status: subscriptionsCount > 0 ? 'OK' : 'WARNING',
      message: `${subscriptionsCount} suscripción(es) encontrada(s)`
    });

    // Verificar usuario de prueba
    const testUser = await prisma.user.findUnique({
      where: { email: 'prueba@clinica.com' }
    });
    results.push({
      component: 'Test User',
      status: testUser ? 'OK' : 'ERROR',
      message: testUser ? 'Usuario de prueba existe' : 'Usuario de prueba NO encontrado'
    });

  } catch (error: any) {
    results.push({
      component: 'Database',
      status: 'ERROR',
      message: `Error de conexión: ${error.message}`
    });
  }
}

function checkCriticalFiles() {
  console.log('🔍 Verificando archivos críticos...');
  
  const criticalFiles = [
    'lib/subscription.ts',
    'lib/subscription-plans.ts',
    'lib/stripe.ts',
    'prisma/schema.prisma',
    'app/api/stripe/checkout/route.ts',
    'app/api/webhooks/stripe/route.ts',
    'app/api/subscription/route.ts',
    '.env'
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    
    results.push({
      component: `File: ${file}`,
      status: exists ? 'OK' : 'ERROR',
      message: exists ? 'Archivo existe' : 'Archivo NO encontrado'
    });
  }
}

function checkEnvironmentVariables() {
  console.log('🔍 Verificando variables de entorno...');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  for (const envVar of requiredVars) {
    const exists = !!process.env[envVar];
    
    results.push({
      component: `ENV: ${envVar}`,
      status: exists ? 'OK' : 'ERROR',
      message: exists ? 'Variable configurada' : 'Variable NO configurada'
    });
  }
}

function printResults() {
  console.log('\n📊 RESULTADO DE LA VERIFICACIÓN\n');
  console.log('═'.repeat(70));
  
  let hasErrors = false;
  let hasWarnings = false;

  for (const result of results) {
    const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${result.component.padEnd(30)} | ${result.message}`);
    
    if (result.status === 'ERROR') hasErrors = true;
    if (result.status === 'WARNING') hasWarnings = true;
  }

  console.log('═'.repeat(70));
  
  if (hasErrors) {
    console.log('\n❌ ERRORES DETECTADOS - EL SISTEMA NO ESTÁ FUNCIONANDO CORRECTAMENTE');
    console.log('⚠️  NO HACER CAMBIOS HASTA RESOLVER LOS ERRORES');
  } else if (hasWarnings) {
    console.log('\n⚠️  ADVERTENCIAS DETECTADAS - EL SISTEMA PUEDE TENER PROBLEMAS');
  } else {
    console.log('\n✅ SISTEMA SALUDABLE - TODOS LOS COMPONENTES FUNCIONANDO');
  }
  
  console.log('\n');
}

async function main() {
  console.log('🔒 VERIFICACIÓN DE SALUD DEL SISTEMA SAAS');
  console.log('==========================================\n');

  await checkDatabase();
  checkCriticalFiles();
  checkEnvironmentVariables();
  
  printResults();
}

main()
  .catch((error) => {
    console.error('❌ Error en verificación:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
