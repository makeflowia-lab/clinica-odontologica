# 📘 Instrucciones Técnicas: Multi-Tenancy para Clínica Odontológica

## 🎯 Objetivo

Implementar un sistema **Multi-Tenancy completo** que permita que múltiples clínicas odontológicas utilicen la misma aplicación con **aislamiento total de datos** entre ellas. Cada clínica (tenant) tendrá sus propios pacientes, citas, tratamientos, facturas, etc.

---

## 📋 Índice

1. [Modelo de Multi-Tenancy](#1-modelo-de-multi-tenancy)
2. [Cambios en el Schema de Prisma](#2-cambios-en-el-schema-de-prisma)
3. [Actualización del Sistema de Autenticación](#3-actualización-del-sistema-de-autenticación)
4. [Actualización de API Routes](#4-actualización-de-api-routes)
5. [Actualización de Componentes](#5-actualización-de-componentes)
6. [Seed Script](#6-seed-script)
7. [Migraciones de Base de Datos](#7-migraciones-de-base-de-datos)
8. [Despliegue a Vercel](#8-despliegue-a-vercel)
9. [Correcciones de Terminología](#9-correcciones-de-terminología)

---

## 1. Modelo de Multi-Tenancy

### Estrategia: **Shared Database, Shared Schema**

- **Una sola base de datos** con todas las clínicas
- **Cada registro tiene un `tenantId`** que identifica a qué clínica pertenece
- **Filtrado automático** en todas las consultas para aislar datos

### Ventajas

✅ Más económico (una sola base de datos)  
✅ Fácil mantenimiento y actualizaciones  
✅ Escalable para múltiples clínicas

### Modelo Tenant

```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String   // Nombre de la clínica
  slug      String   @unique // URL amigable: clinica-dental-mx
  domain    String?  @unique // Dominio personalizado opcional
  logo      String?
  settings  Json?    // Configuraciones específicas
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  users            User[]
  patients         Patient[]
  appointments     Appointment[]
  treatments       Treatment[]
  materials        Material[]
  invoices         Invoice[]
  clinicalRecords  ClinicalRecord[]
  odontograms      Odontogram[]
  notifications    Notification[]
  settings_table   Setting[]

  @@map("tenants")
}
```

---

## 2. Cambios en el Schema de Prisma

### 2.1 Agregar `tenantId` a TODOS los modelos principales

Cada modelo que contenga datos de negocio debe tener:

```prisma
model User {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("users")
}

model Patient {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("patients")
}

model Appointment {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("appointments")
}

model Treatment {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("treatments")
}

model Material {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("materials")
}

model Invoice {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("invoices")
}

model ClinicalRecord {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("clinical_records")
}

model Odontogram {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("odontograms")
}

model Notification {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("notifications")
}

model Setting {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("settings")
}
```

### 2.2 Modelos que NO necesitan `tenantId`

- `RateLimit` - Es global por seguridad
- `AuditLog` - Puede ser global o tener tenantId (opcional)
- `TreatmentMaterial` - Es una tabla de relación, hereda el tenant del Treatment
- `InvoiceItem` - Es una tabla de relación, hereda el tenant del Invoice
- `Payment` - Es una tabla de relación, hereda el tenant del Invoice

---

## 3. Actualización del Sistema de Autenticación

### 3.1 Actualizar `lib/auth.ts`

```typescript
import jwt, { SignOptions } from "jsonwebtoken";
import bcryptjs from "bcryptjs"; // ← CAMBIAR de bcrypt a bcryptjs

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "DENTIST" | "RECEPTIONIST";
  tenantId: string; // ← AGREGAR
  clinicId?: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10); // ← CAMBIAR a bcryptjs
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash); // ← CAMBIAR a bcryptjs
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
```

### 3.2 Actualizar `package.json`

Cambiar de `bcrypt` a `bcryptjs` para compatibilidad con Vercel:

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3" // ← AGREGAR
    // ... otras dependencias
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6" // ← AGREGAR
    // ... otras dev dependencies
  }
}
```

**Eliminar:**

- `"bcrypt": "^5.1.1"`
- `"@types/bcrypt": "^5.0.2"`

---

## 4. Actualización de API Routes

### 🔴 REGLA DE ORO

**TODAS las consultas a la base de datos DEBEN incluir el filtro `tenantId`**

### 4.1 Patrón para API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Obtener tenantId del token
    const user = verifyToken(token);
    const tenantId = user.tenantId;

    // 3. SIEMPRE filtrar por tenantId
    const data = await prisma.patient.findMany({
      where: {
        tenantId, // ← CRÍTICO: Siempre incluir
        // ... otros filtros
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = verifyToken(token);
    const tenantId = user.tenantId;

    const body = await request.json();

    // 4. SIEMPRE incluir tenantId al crear
    const newRecord = await prisma.patient.create({
      data: {
        ...body,
        tenantId, // ← CRÍTICO: Siempre incluir
      },
    });

    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

### 4.2 Routes que necesitan actualización

Todos los archivos en `app/api/`:

- ✅ `appointments/route.ts`
- ✅ `patients/route.ts`
- ✅ `treatments/route.ts`
- ✅ `inventory/route.ts`
- ✅ `inventory/used/route.ts`
- ✅ `invoices/route.ts`
- ✅ `clinical-records/route.ts`
- ✅ `odontogram/route.ts`
- ✅ `records/route.ts`
- ✅ `settings/route.ts`
- ✅ `users/dentists/route.ts`
- ✅ `dashboard/stats/route.ts`

### 4.3 Ejemplo completo: `app/api/patients/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { z } from "zod";
import { extractTokenFromHeader, verifyToken } from "@/lib/auth";

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(["M", "F", "OTHER"]),
  // ... otros campos
});

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = verifyToken(token);
    const tenantId = user.tenantId; // ← Obtener tenantId

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const patient = await prisma.patient.findFirst({
        where: {
          id,
          tenantId, // ← FILTRAR por tenantId
        },
        include: {
          appointments: {
            where: { tenantId }, // ← También en relaciones
            orderBy: { dateTime: "desc" },
            take: 10,
          },
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Paciente no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ patient });
    }

    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const whereClause = {
      tenantId, // ← SIEMPRE incluir
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      prisma.patient.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      patients,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json(
      { error: "Error al obtener pacientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = verifyToken(token);
    const tenantId = user.tenantId; // ← Obtener tenantId

    const body = await request.json();
    const data = patientSchema.parse(body);

    const patient = await prisma.patient.create({
      data: {
        ...data,
        tenantId, // ← INCLUIR tenantId
        email: data.email || null,
        dateOfBirth: new Date(data.dateOfBirth),
        allergies: data.allergies || [],
        medicalConditions: data.medicalConditions || [],
        medications: data.medications || [],
        createdBy: {
          connect: { id: user.userId },
        },
      },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error("Create patient error:", error);
    return NextResponse.json(
      { error: "Error al crear paciente" },
      { status: 500 }
    );
  }
}

// PUT y DELETE siguen el mismo patrón
```

---

## 5. Actualización de Componentes

### 5.1 Modales en lugar de `alert()` y `confirm()`

Crear componente de confirmación personalizado:

```typescript
// components/ConfirmDialog.tsx
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
          <Dialog.Title className="text-lg font-semibold mb-2">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-gray-600 mb-4">
            {description}
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                {cancelText}
              </button>
            </Dialog.Close>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### 5.2 Uso del modal de confirmación

```typescript
const [confirmDialog, setConfirmDialog] = useState({
  open: false,
  title: "",
  description: "",
  onConfirm: () => {},
});

// En lugar de:
// if (confirm("¿Estás seguro?")) { deletePatient(); }

// Usar:
setConfirmDialog({
  open: true,
  title: "Eliminar Paciente",
  description: "¿Estás seguro de que deseas eliminar este paciente?",
  onConfirm: () => deletePatient(id),
});

// En el JSX:
<ConfirmDialog
  open={confirmDialog.open}
  onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
  title={confirmDialog.title}
  description={confirmDialog.description}
  onConfirm={confirmDialog.onConfirm}
/>;
```

---

## 6. Seed Script

### 6.1 Actualizar `prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs"; // ← CAMBIAR a bcryptjs
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de multi-tenancy...\n");

  // 1. Crear tenant de ejemplo
  const tenant = await prisma.tenant.create({
    data: {
      name: "Clínica Dental Demo",
      slug: "clinica-demo",
      isActive: true,
      settings: {
        timezone: "America/Mexico_City",
        currency: "MXN",
      },
    },
  });

  console.log("✅ Tenant creado:", tenant.name);

  // 2. Crear admin para ese tenant
  const hashedPassword = await bcryptjs.hash("Admin123!", 10);
  const hashedRecoverySecret = await bcryptjs.hash("RECOVERY2024", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@clinica-demo.com",
      password: hashedPassword,
      firstName: "Administrador",
      lastName: "Principal",
      role: "ADMIN",
      tenantId: tenant.id, // ← INCLUIR tenantId
      isTemporaryAdmin: false,
      recoverySecret: hashedRecoverySecret,
    },
  });

  console.log("✅ Admin creado:", admin.email);
  console.log("\n📋 Credenciales:");
  console.log("   Email: admin@clinica-demo.com");
  console.log("   Password: Admin123!");
  console.log("   Recovery: RECOVERY2024\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 7. Migraciones de Base de Datos

### 7.1 Comandos de migración

```bash
# 1. Generar el cliente de Prisma
npm run db:generate

# 2. Crear la migración
npx prisma migrate dev --name add_multitenancy

# 3. Aplicar la migración
npx prisma migrate deploy

# 4. Ejecutar el seed
npm run db:seed
```

### 7.2 Si hay datos existentes

Si ya tienes datos en producción, necesitas una migración especial:

```sql
-- Primero crear un tenant por defecto
INSERT INTO tenants (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Clínica Principal',
  'clinica-principal',
  true,
  NOW(),
  NOW()
);

-- Luego actualizar todos los registros existentes
UPDATE users SET "tenantId" = (SELECT id FROM tenants LIMIT 1);
UPDATE patients SET "tenantId" = (SELECT id FROM tenants LIMIT 1);
UPDATE appointments SET "tenantId" = (SELECT id FROM tenants LIMIT 1);
-- ... etc para todas las tablas
```

---

## 8. Despliegue a Vercel

### 8.1 Variables de entorno

Asegúrate de tener en Vercel:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="tu-secret-super-seguro"
JWT_EXPIRES_IN="7d"
```

### 8.2 Comandos de deploy

```bash
# 1. Commit de cambios
git add .
git commit -m "feat: implement multi-tenancy system"

# 2. Push a GitHub
git push origin main

# 3. Vercel desplegará automáticamente

# 4. Ejecutar migraciones en producción (desde Vercel CLI o dashboard)
npx prisma migrate deploy
```

---

## 9. Correcciones de Terminología

### Cambios necesarios en la UI:

| Antes                 | Después                   |
| --------------------- | ------------------------- |
| "Crear Mascota"       | "Crear Paciente"          |
| "Mascotas"            | "Pacientes"               |
| "Veterinario"         | "Odontólogo" o "Dentista" |
| "Clínica Veterinaria" | "Clínica Odontológica"    |

### Archivos a revisar:

- `components/Dashboard.tsx`
- `components/PatientForm.tsx`
- `app/dashboard/page.tsx`
- Cualquier otro componente con texto visible

---

## ✅ Checklist Final

- [ ] Modelo `Tenant` agregado al schema
- [ ] `tenantId` agregado a todos los modelos principales
- [ ] Índices creados para `tenantId`
- [ ] `lib/auth.ts` actualizado con `tenantId` en JWT
- [ ] `bcrypt` cambiado a `bcryptjs` en todo el proyecto
- [ ] Todos los API routes filtran por `tenantId`
- [ ] Modales personalizados en lugar de `alert()` y `confirm()`
- [ ] Seed script actualizado
- [ ] Migraciones ejecutadas
- [ ] Terminología corregida (Paciente, Odontólogo)
- [ ] Desplegado a Vercel
- [ ] Probado con múltiples tenants

---

## 🚨 Reglas Críticas

### **NUNCA OLVIDES:**

1. **SIEMPRE** incluir `tenantId` en las consultas WHERE
2. **SIEMPRE** incluir `tenantId` al crear registros
3. **SIEMPRE** verificar el token antes de cualquier operación
4. **NUNCA** permitir acceso a datos de otro tenant
5. **USAR** `bcryptjs` en lugar de `bcrypt` para Vercel

---

## 📚 Recursos Adicionales

- [Prisma Multi-Tenancy Guide](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Vercel Deployment Docs](https://vercel.com/docs)

---

**¡Implementación completa de Multi-Tenancy para Clínica Odontológica! 🦷✨**
