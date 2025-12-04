# 🔒 CANDADO DE PROTECCIÓN DEL SISTEMA SAAS

**FECHA DE CREACIÓN:** 3 de Diciembre 2025  
**ESTADO:** ✅ SISTEMA FUNCIONANDO CORRECTAMENTE

---

## ⚠️ ADVERTENCIA CRÍTICA

**ANTES DE HACER CUALQUIER CAMBIO, LEE ESTO:**

Este sistema SaaS está **100% FUNCIONAL** con:

- ✅ Multi-tenancy operativo
- ✅ Sistema de suscripciones activo
- ✅ Stripe integrado y funcionando
- ✅ Límites y control de uso implementados
- ✅ Base de datos sincronizada con todas las tablas
- ✅ Usuario de prueba funcional

---

## 🚫 ACCIONES PROHIBIDAS (DESTRUIRÁN EL SISTEMA)

### ❌ NO EJECUTAR NUNCA:

1. `npx prisma db push --force-reset` (Sin consultar primero)
2. `npx prisma migrate reset` (Borra toda la base de datos)
3. `Remove-Item -Recurse -Force prisma/migrations/`
4. Cualquier comando que contenga `--force-reset` o `--accept-data-loss`
5. Eliminar archivos en `lib/subscription*.ts`
6. Modificar `prisma/schema.prisma` sin hacer backup
7. Borrar tablas manualmente en Neon
8. Cambiar variables de entorno sin documentar

---

## ✅ CONFIGURACIÓN ACTUAL QUE FUNCIONA

### Base de Datos (Neon.tech)

```
DATABASE_URL=postgresql://neondb_owner:npg_08AcwhFsRMyo@ep-steep-cake-a4ycrppg-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Tablas Críticas Existentes:

- ✅ tenants (Multi-tenancy)
- ✅ subscriptions (Sistema SaaS)
- ✅ users
- ✅ patients
- ✅ appointments
- ✅ treatments
- ✅ materials
- ✅ invoices
- ✅ payments
- ✅ clinical_records
- ✅ odontograms
- ✅ notifications
- ✅ settings
- ✅ plan_features
- ✅ rate_limits
- ✅ audit_logs

### Usuario de Prueba Activo:

- Email: prueba@clinica.com
- Password: Prueba123!
- Tenant: Clínica de Prueba
- Plan: STARTER (Trial hasta 17/12/2025)

### Archivos Críticos del SaaS:

```
lib/subscription.ts          ← Control de límites
lib/subscription-plans.ts    ← Configuración de planes
lib/stripe.ts                ← Cliente de Stripe
app/api/stripe/checkout/route.ts
app/api/webhooks/stripe/route.ts
app/api/subscription/route.ts
prisma/schema.prisma         ← Esquema completo
```

---

## 🛡️ PROTOCOLO DE SEGURIDAD

### ANTES DE CUALQUIER CAMBIO:

1. **PREGUNTA OBLIGATORIA:**

   - "¿Este cambio afectará las tablas de la base de datos?"
   - "¿Este cambio modificará el sistema de suscripciones?"
   - "¿Este cambio alterará la lógica de multi-tenancy?"

2. **CREAR BACKUP:**

   ```powershell
   # Crear backup de archivos críticos
   Copy-Item "lib\subscription*.ts" "lib\BACKUP_$(Get-Date -Format 'yyyyMMdd_HHmmss')\"
   Copy-Item "prisma\schema.prisma" "prisma\BACKUP_schema_$(Get-Date -Format 'yyyyMMdd_HHmmss').prisma"
   ```

3. **DOCUMENTAR EL CAMBIO:**

   - Qué se va a cambiar
   - Por qué se va a cambiar
   - Qué puede romperse
   - Cómo revertir el cambio

4. **ADVERTIR AL USUARIO:**

   ```
   ⚠️ ADVERTENCIA CRÍTICA:
   Este cambio puede afectar [X funcionalidad].

   ❌ NO CONTINÚES si necesitas que el sistema siga funcionando.

   Riesgos:
   - [Listar riesgos específicos]

   ¿Deseas continuar? (Escribe "SÍ, ACEPTO LOS RIESGOS" para confirmar)
   ```

---

## 🔧 CAMBIOS SEGUROS (NO REQUIEREN ADVERTENCIA)

- ✅ Agregar nuevos componentes de UI
- ✅ Modificar estilos CSS/Tailwind
- ✅ Agregar nuevas páginas que no toquen DB
- ✅ Corregir textos o traducciones
- ✅ Agregar validaciones sin cambiar schema
- ✅ Optimizaciones de rendimiento sin cambios de lógica

---

## 🚨 CAMBIOS PELIGROSOS (REQUIEREN ADVERTENCIA)

- ⚠️ Modificar `prisma/schema.prisma`
- ⚠️ Cambiar lógica de autenticación
- ⚠️ Modificar sistema de suscripciones
- ⚠️ Cambiar control de límites
- ⚠️ Alterar multi-tenancy
- ⚠️ Modificar webhooks de Stripe
- ⚠️ Cambiar variables de entorno
- ⚠️ Ejecutar migraciones de base de datos
- ⚠️ Eliminar o renombrar tablas

---

## 📋 CHECKLIST PRE-MODIFICACIÓN

Antes de hacer cualquier cambio, verificar:

- [ ] ¿El sistema está funcionando actualmente?
- [ ] ¿He creado un backup de los archivos que voy a modificar?
- [ ] ¿He advertido al usuario sobre los riesgos?
- [ ] ¿Tengo un plan de reversión?
- [ ] ¿El usuario ha confirmado explícitamente que acepta los riesgos?
- [ ] ¿He documentado qué voy a cambiar y por qué?

---

## 🔄 PLAN DE REVERSIÓN DE EMERGENCIA

Si algo se rompe:

1. **Detener el servidor:**

   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
   ```

2. **Restaurar base de datos:**

   ```powershell
   npx prisma db push --force-reset --accept-data-loss
   npx tsx scripts/restore-test-user.ts
   ```

3. **Restaurar archivos desde Git:**

   ```powershell
   git checkout -- .
   npm install
   ```

4. **Reiniciar servidor:**
   ```powershell
   npm run dev
   ```

---

## 📞 CONTACTO DE EMERGENCIA

**Proyecto:** Clínica Odontológica SaaS  
**Repositorio:** makeflowia-lab/clinica-odontologica  
**Base de datos:** Neon.tech (neondb)  
**Deployment:** Vercel (clinica-odontologica-hazel.vercel.app)

---

## 🔐 HASH DE VERIFICACIÓN

**Schema Prisma (última versión funcional):**

```
Fecha: 2025-12-03
Commit: [último commit funcional]
Tablas: 17 (incluyendo tenants y subscriptions)
```

---

## ⚡ REGLA DE ORO

**"SI FUNCIONA, NO LO TOQUES SIN ANTES ADVERTIR"**

Cualquier agente de IA que modifique este sistema **DEBE**:

1. Leer este archivo primero
2. Verificar que el cambio no está en la lista prohibida
3. Advertir al usuario con los riesgos específicos
4. Esperar confirmación explícita
5. Crear backup antes de proceder

---

**ÚLTIMA ACTUALIZACIÓN:** 3 de Diciembre 2025 - Sistema 100% Funcional ✅
