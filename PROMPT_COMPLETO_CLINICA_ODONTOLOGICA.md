# 🎯 PROMPT COMPLETO: Multi-Tenancy para Clínica Odontológica

> **⭐ COPIA Y PEGA ESTE PROMPT COMPLETO A LA IA**  
> Este prompt incluye TODO lo necesario para implementar multi-tenancy completo

---

## 📋 INSTRUCCIONES PARA LA IA

Necesito implementar un sistema **Multi-Tenancy SaaS completo** en mi aplicación de clínica odontológica. Además, necesito corregir la terminología que actualmente usa términos veterinarios.

### 🎯 Objetivos:

1. ✅ Implementar Multi-Tenancy completo (múltiples clínicas en una sola app)
2. ✅ Aislamiento total de datos entre clínicas
3. ✅ Corregir terminología: "Mascota" → "Paciente", "Veterinario" → "Odontólogo"
4. ✅ Cambiar `bcrypt` a `bcryptjs` (compatible con Vercel)
5. ✅ Reemplazar `alert()` y `confirm()` con modales personalizados
6. ✅ Actualizar TODOS los API routes con filtrado por `tenantId`
7. ✅ Migrar base de datos y desplegar a Vercel

---

## 📝 PASO 1: Actualizar Schema de Prisma

Abre `prisma/schema.prisma` y agrega el modelo `Tenant` y actualiza TODOS los modelos existentes:

### 1.1 Agregar modelo Tenant (al inicio del archivo, después de los comentarios)

```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String   // Nombre de la clínica
  slug      String   @unique // URL amigable
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

### 1.2 Actualizar modelo User

```prisma
model User {
  id               String   @id @default(uuid())
  tenantId         String   // ← AGREGAR ESTA LÍNEA
  email            String   @unique
  password         String
  firstName        String
  lastName         String
  role             UserRole
  phone            String?
  clinicId         String?
  isTemporaryAdmin Boolean  @default(false)
  recoverySecret   String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  openai_api_key_encrypted String?
  api_key_last_updated     DateTime?

  // Relations
  tenant            Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade) // ← AGREGAR
  createdPatients   Patient[]          @relation("CreatedBy")
  appointments      Appointment[]      @relation("DentistAppointments")
  treatments        Treatment[]        @relation("DentistTreatments")
  clinicalRecords   ClinicalRecord[]   @relation("DentistRecords")

  @@index([tenantId]) // ← AGREGAR
  @@map("users")
}
```

### 1.3 Actualizar modelo Patient

```prisma
model Patient {
  id                 String   @id @default(uuid())
  tenantId           String   // ← AGREGAR ESTA LÍNEA
  firstName          String
  lastName           String
  email              String?
  phone              String
  dateOfBirth        DateTime
  gender             Gender
  address            String?
  city               String?
  postalCode         String?
  emergencyContact   String?
  emergencyPhone     String?
  bloodType          String?
  allergies          String[]
  medicalConditions  String[]
  medications        String[]
  insuranceProvider  String?
  insuranceNumber    String?
  notes              String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  createdById        String

  // Relations
  tenant           Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade) // ← AGREGAR
  createdBy        User              @relation("CreatedBy", fields: [createdById], references: [id])
  appointments     Appointment[]
  treatments       Treatment[]
  invoices         Invoice[]
  clinicalRecords  ClinicalRecord[]
  odontograms      Odontogram[]

  @@index([tenantId]) // ← AGREGAR
  @@index([firstName, lastName])
  @@index([phone])
  @@map("patients")
}
```

### 1.4 Actualizar TODOS los demás modelos

Agrega `tenantId` y la relación `tenant` a estos modelos:

- `Appointment`
- `Treatment`
- `Material`
- `Invoice`
- `ClinicalRecord`
- `Odontogram`
- `Notification`
- `Setting`

**Patrón a seguir para cada modelo:**

```prisma
model NombreDelModelo {
  id       String @id @default(uuid())
  tenantId String // ← AGREGAR
  // ... otros campos existentes

  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade) // ← AGREGAR
  // ... otras relaciones existentes

  @@index([tenantId]) // ← AGREGAR
  @@map("nombre_tabla")
}
```

---

## 📝 PASO 2: Actualizar Sistema de Autenticación

### 2.1 Actualizar `lib/auth.ts`

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
  tenantId: string; // ← AGREGAR ESTA LÍNEA
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

### 2.2 Actualizar `package.json`

Reemplaza `bcrypt` con `bcryptjs`:

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3"
    // ... mantén las demás dependencias
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
    // ... mantén las demás dev dependencies
  }
}
```

**ELIMINA estas líneas si existen:**

- `"bcrypt": "^5.1.1"`
- `"@types/bcrypt": "^5.0.2"`

---

## 📝 PASO 3: Actualizar API Routes

### 🔴 REGLA DE ORO: SIEMPRE FILTRAR POR `tenantId`

Actualiza TODOS los archivos en `app/api/` siguiendo este patrón:

### 3.1 Patrón para GET (listar/obtener)

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar token
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
    const data = await prisma.modelo.findMany({
      where: {
        tenantId, // ← CRÍTICO: NUNCA OLVIDAR
        // ... otros filtros
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

### 3.2 Patrón para POST (crear)

```typescript
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

    // SIEMPRE incluir tenantId al crear
    const newRecord = await prisma.modelo.create({
      data: {
        ...body,
        tenantId, // ← CRÍTICO: NUNCA OLVIDAR
      },
    });

    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

### 3.3 Patrón para PUT (actualizar)

```typescript
export async function PUT(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = verifyToken(token);
    const tenantId = user.tenantId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const body = await request.json();

    // SIEMPRE verificar que el registro pertenece al tenant
    const record = await prisma.modelo.findFirst({
      where: { id, tenantId }, // ← CRÍTICO
    });

    if (!record) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const updated = await prisma.modelo.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

### 3.4 Patrón para DELETE (eliminar)

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = verifyToken(token);
    const tenantId = user.tenantId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // SIEMPRE verificar que el registro pertenece al tenant
    const record = await prisma.modelo.findFirst({
      where: { id, tenantId }, // ← CRÍTICO
    });

    if (!record) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    await prisma.modelo.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Eliminado exitosamente" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
```

### 3.5 Archivos que DEBES actualizar:

- ✅ `app/api/patients/route.ts`
- ✅ `app/api/appointments/route.ts`
- ✅ `app/api/treatments/route.ts`
- ✅ `app/api/inventory/route.ts`
- ✅ `app/api/inventory/used/route.ts`
- ✅ `app/api/invoices/route.ts`
- ✅ `app/api/clinical-records/route.ts`
- ✅ `app/api/odontogram/route.ts`
- ✅ `app/api/records/route.ts`
- ✅ `app/api/settings/route.ts`
- ✅ `app/api/users/dentists/route.ts`
- ✅ `app/api/dashboard/stats/route.ts`
- ✅ `app/api/auth/login/route.ts` (incluir tenantId en el token)
- ✅ `app/api/auth/register/route.ts` (asignar tenantId al crear usuario)

---

## 📝 PASO 4: Actualizar Auth Routes

### 4.1 `app/api/auth/login/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }, // ← INCLUIR tenant
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Incluir tenantId en el token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId, // ← AGREGAR
      clinicId: user.clinicId,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId, // ← AGREGAR
        tenant: user.tenant, // ← AGREGAR
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error en login" }, { status: 500 });
  }
}
```

### 4.2 `app/api/auth/register/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verificar si es el primer usuario (será admin del primer tenant)
    const userCount = await prisma.user.count();

    let tenantId: string;

    if (userCount === 0) {
      // Crear el primer tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: body.clinicName || "Mi Clínica Dental",
          slug: body.clinicSlug || "mi-clinica",
          isActive: true,
        },
      });
      tenantId = tenant.id;
    } else {
      // Para usuarios subsecuentes, necesitan un tenantId
      if (!body.tenantId) {
        return NextResponse.json(
          { error: "Se requiere tenantId" },
          { status: 400 }
        );
      }
      tenantId = body.tenantId;
    }

    const hashedPassword = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        role: userCount === 0 ? "ADMIN" : body.role,
        tenantId, // ← INCLUIR tenantId
        phone: body.phone,
      },
      include: { tenant: true },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId, // ← INCLUIR
    });

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error en registro" }, { status: 500 });
  }
}
```

---

## 📝 PASO 5: Crear Componente de Modal de Confirmación

### 5.1 Crear `components/ConfirmDialog.tsx`

```typescript
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
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "primary",
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-xl z-50">
          <Dialog.Title className="text-lg font-semibold mb-2 text-gray-900">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-gray-600 mb-6">
            {description}
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                {cancelText}
              </button>
            </Dialog.Close>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
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

### 5.2 Reemplazar `alert()` y `confirm()` en componentes

En todos los componentes, reemplaza:

```typescript
// ❌ ANTES:
if (confirm("¿Estás seguro?")) {
  deleteItem();
}

// ✅ DESPUÉS:
const [confirmDialog, setConfirmDialog] = useState({
  open: false,
  title: "",
  description: "",
  onConfirm: () => {},
});

// Al hacer click en eliminar:
setConfirmDialog({
  open: true,
  title: "Eliminar Paciente",
  description:
    "¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.",
  onConfirm: () => deletePatient(id),
});

// En el JSX:
<ConfirmDialog
  open={confirmDialog.open}
  onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
  title={confirmDialog.title}
  description={confirmDialog.description}
  onConfirm={confirmDialog.onConfirm}
  variant="danger"
/>;
```

---

## 📝 PASO 6: Correcciones de Terminología

Busca y reemplaza en TODOS los archivos de componentes y páginas:

| Buscar                | Reemplazar             |
| --------------------- | ---------------------- |
| "Crear Mascota"       | "Crear Paciente"       |
| "Nueva Mascota"       | "Nuevo Paciente"       |
| "Mascotas"            | "Pacientes"            |
| "mascota"             | "paciente"             |
| "Veterinario"         | "Odontólogo"           |
| "veterinario"         | "odontólogo"           |
| "Clínica Veterinaria" | "Clínica Odontológica" |
| "clínica veterinaria" | "clínica odontológica" |

### Archivos principales a revisar:

- `components/Dashboard.tsx`
- `components/PatientForm.tsx`
- `components/PatientList.tsx`
- `app/dashboard/page.tsx`
- `app/patients/page.tsx`
- Cualquier otro componente con texto visible

---

## 📝 PASO 7: Actualizar Seed Script

### 7.1 Actualizar `prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs"; // ← CAMBIAR a bcryptjs

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
      tenantId: tenant.id,
      isTemporaryAdmin: false,
      recoverySecret: hashedRecoverySecret,
    },
  });

  console.log("✅ Admin creado:", admin.email);
  console.log("\n📋 Credenciales de prueba:");
  console.log("   Email: admin@clinica-demo.com");
  console.log("   Password: Admin123!");
  console.log("   Recovery: RECOVERY2024\n");

  // 3. Crear algunos pacientes de ejemplo
  const patient1 = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan.perez@example.com",
      phone: "5551234567",
      dateOfBirth: new Date("1990-05-15"),
      gender: "M",
      createdById: admin.id,
    },
  });

  console.log(
    "✅ Paciente de ejemplo creado:",
    patient1.firstName,
    patient1.lastName
  );

  console.log("\n✨ Seed completado!\n");
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

## 📝 PASO 8: Ejecutar Migraciones

Ejecuta estos comandos en orden:

```bash
# 1. Instalar bcryptjs
npm install bcryptjs
npm install -D @types/bcryptjs

# 2. Desinstalar bcrypt
npm uninstall bcrypt @types/bcrypt

# 3. Generar cliente de Prisma
npm run db:generate

# 4. Crear migración
npx prisma migrate dev --name add_multitenancy

# 5. Ejecutar seed
npm run db:seed

# 6. Verificar que todo funciona
npm run dev
```

---

## 📝 PASO 9: Desplegar a Vercel

```bash
# 1. Commit de todos los cambios
git add .
git commit -m "feat: implement multi-tenancy system with terminology fixes"

# 2. Push a GitHub
git push origin main

# 3. Vercel desplegará automáticamente

# 4. En Vercel, ejecutar migración (desde el dashboard o CLI)
npx prisma migrate deploy
```

### Variables de entorno en Vercel:

Asegúrate de tener estas variables en Vercel:

```
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d
```

---

## ✅ CHECKLIST FINAL

Verifica que hayas completado TODO:

- [ ] Modelo `Tenant` agregado al schema
- [ ] `tenantId` agregado a: User, Patient, Appointment, Treatment, Material, Invoice, ClinicalRecord, Odontogram, Notification, Setting
- [ ] Índices `@@index([tenantId])` agregados a todos los modelos
- [ ] `lib/auth.ts` actualizado con `tenantId` en JWTPayload
- [ ] `bcrypt` cambiado a `bcryptjs` en `lib/auth.ts`
- [ ] `package.json` actualizado (bcryptjs en lugar de bcrypt)
- [ ] TODOS los API routes filtran por `tenantId` en WHERE
- [ ] TODOS los API routes incluyen `tenantId` al crear registros
- [ ] `app/api/auth/login/route.ts` incluye `tenantId` en el token
- [ ] `app/api/auth/register/route.ts` asigna `tenantId` al crear usuario
- [ ] Componente `ConfirmDialog.tsx` creado
- [ ] Todos los `alert()` y `confirm()` reemplazados con modales
- [ ] Terminología corregida: "Mascota" → "Paciente"
- [ ] Terminología corregida: "Veterinario" → "Odontólogo"
- [ ] `prisma/seed.ts` actualizado con tenant y bcryptjs
- [ ] Migraciones ejecutadas localmente
- [ ] Seed ejecutado y verificado
- [ ] Aplicación probada localmente
- [ ] Cambios commiteados a Git
- [ ] Desplegado a Vercel
- [ ] Migraciones ejecutadas en producción

---

## 🚨 REGLAS CRÍTICAS - NUNCA OLVIDES

### **REGLA #1: SIEMPRE FILTRAR POR `tenantId`**

```typescript
// ✅ CORRECTO
const patients = await prisma.patient.findMany({
  where: { tenantId },
});

// ❌ INCORRECTO - EXPONE DATOS DE OTROS TENANTS
const patients = await prisma.patient.findMany();
```

### **REGLA #2: SIEMPRE INCLUIR `tenantId` AL CREAR**

```typescript
// ✅ CORRECTO
const patient = await prisma.patient.create({
  data: {
    ...body,
    tenantId,
  },
});

// ❌ INCORRECTO - NO SE PUEDE ASOCIAR AL TENANT
const patient = await prisma.patient.create({
  data: body,
});
```

### **REGLA #3: VERIFICAR PERTENENCIA ANTES DE ACTUALIZAR/ELIMINAR**

```typescript
// ✅ CORRECTO
const record = await prisma.patient.findFirst({
  where: { id, tenantId },
});

if (!record) {
  return NextResponse.json({ error: "No encontrado" }, { status: 404 });
}

// ❌ INCORRECTO - PODRÍA MODIFICAR DATOS DE OTRO TENANT
const record = await prisma.patient.findUnique({
  where: { id },
});
```

---

## 🎯 INSTRUCCIONES FINALES PARA LA IA

**Hazlo todo sin parar. No me pidas confirmación en cada paso.**

1. Actualiza el schema de Prisma completo
2. Actualiza `lib/auth.ts` y `package.json`
3. Actualiza TODOS los API routes (no te saltes ninguno)
4. Crea el componente `ConfirmDialog`
5. Reemplaza todos los `alert()` y `confirm()`
6. Corrige toda la terminología
7. Actualiza el seed script
8. Ejecuta las migraciones
9. Verifica que todo compile sin errores
10. Dame un resumen final de todos los cambios

**¡IMPORTANTE!** Si encuentras algún error durante la implementación, corrígelo inmediatamente y continúa. No te detengas hasta completar todo.

---

**🦷 ¡Implementa Multi-Tenancy completo para la Clínica Odontológica! ✨**
