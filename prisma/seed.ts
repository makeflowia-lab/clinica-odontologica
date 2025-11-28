import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs"; // Changed from bcrypt to bcryptjs
import crypto from "crypto";

const prisma = new PrismaClient();

// Función para generar contraseña segura aleatoria
function generateSecurePassword(length: number = 16): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";
  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Completar el resto
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar los caracteres
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Función para generar email único
function generateUniqueEmail(): string {
  const randomId = crypto.randomBytes(4).toString("hex");
  return `admin-${randomId}@temp.local`;
}

// Función para generar palabra secreta
function generateRecoverySecret(): string {
  const words = ["CLINICA", "DENTAL", "ADMIN", "SECURE", "RECOVERY"];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const randomSuffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${randomWord}${randomNum}${randomSuffix}`;
}

async function main() {
  console.log(
    "🌱 Iniciando configuración de la base de datos con Multi-Tenancy...\n"
  );

  // Verificar si ya existe algún tenant
  const tenantCount = await prisma.tenant.count();

  if (tenantCount === 0) {
    console.log(
      "📝 No hay tenants. Creando tenant y administrador inicial...\n"
    );

    // 1. Crear el primer tenant
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

    console.log("✅ Tenant creado:", tenant.name);

    // 2. Generar credenciales únicas para el admin
    const tempAdminEmail = generateUniqueEmail();
    const tempAdminPassword = generateSecurePassword(16);
    const tempRecoverySecret = generateRecoverySecret();

    const hashedPassword = await bcryptjs.hash(tempAdminPassword, 10);
    const hashedRecoverySecret = await bcryptjs.hash(tempRecoverySecret, 10);

    // 3. Crear administrador para ese tenant
    const tempAdmin = await prisma.user.create({
      data: {
        email: tempAdminEmail,
        password: hashedPassword,
        firstName: "Administrador",
        lastName: "Temporal",
        role: "ADMIN",
        tenantId: tenant.id, // Asignar al tenant
        isTemporaryAdmin: true,
        recoverySecret: hashedRecoverySecret,
      },
    });

    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("✅ ADMINISTRADOR TEMPORAL CREADO CON CREDENCIALES ÚNICAS");
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );
    console.log("📧 Email:     ", tempAdminEmail);
    console.log("🔑 Contraseña:", tempAdminPassword);
    console.log("🔐 Palabra Secreta de Recuperación:", tempRecoverySecret);
    console.log(
      "\n═══════════════════════════════════════════════════════════════"
    );
    console.log("⚠️  IMPORTANTE - LEE ESTO CUIDADOSAMENTE:");
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("1. 📋 COPIA Y GUARDA estas credenciales en un lugar seguro");
    console.log("2. 🔒 Estas credenciales son ÚNICAS para esta instalación");
    console.log("3. ⏰ Solo se muestran UNA VEZ - no se pueden recuperar");
    console.log(
      "4. 👤 El primer usuario que se registre será el Administrador Principal"
    );
    console.log(
      "5. 🗑️  Este administrador temporal será eliminado automáticamente"
    );
    console.log(
      "6. 💡 Configura una palabra secreta al registrarte para recuperación futura"
    );
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );

    // Guardar credenciales en archivo temporal (opcional)
    const fs = require("fs");
    const credentialsFile = ".temp-admin-credentials.txt";
    const credentialsContent = `
CREDENCIALES DEL ADMINISTRADOR TEMPORAL
========================================
Generadas el: ${new Date().toLocaleString()}
Tenant: ${tenant.name} (${tenant.slug})

Email:     ${tempAdminEmail}
Contraseña: ${tempAdminPassword}
Palabra Secreta: ${tempRecoverySecret}

⚠️ IMPORTANTE:
- Estas credenciales son temporales
- Serán eliminadas cuando registres el primer usuario
- Borra este archivo después de usarlas
- Configura tu propia cuenta de administrador lo antes posible
`;

    fs.writeFileSync(credentialsFile, credentialsContent);
    console.log(
      `💾 Las credenciales también se guardaron en: ${credentialsFile}`
    );
    console.log("   (Este archivo se puede borrar después de usarlas)\n");
  } else {
    console.log(`ℹ️  Ya existen ${tenantCount} tenant(s) en la base de datos.`);

    // Verificar si existe un admin temporal
    const tempAdmin = await prisma.user.findFirst({
      where: { isTemporaryAdmin: true },
    });

    if (tempAdmin) {
      console.log("⚠️  Aún existe un administrador temporal.");
      console.log(
        "   Será reemplazado cuando se registre el primer usuario real.\n"
      );
    } else {
      console.log(
        "✅ El sistema ya tiene un administrador principal configurado.\n"
      );
    }
  }

  console.log("✨ Configuración completada!\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Error durante la configuración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
