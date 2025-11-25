# Sistema de Administrador Temporal con Credenciales Únicas

## 🔐 Descripción General

Este sistema implementa un administrador temporal con **credenciales únicas generadas automáticamente** para cada instalación, junto con un sistema de recuperación de cuenta mediante palabra secreta.

## ⚡ Características Principales

- ✅ **Credenciales únicas por instalación** - Cada vez que instalas el sistema, se generan credenciales diferentes
- ✅ **Seguridad mejorada** - Nadie más puede acceder a tu instalación con credenciales públicas
- ✅ **Fácil recuperación** - Sistema de palabra secreta para recuperar acceso
- ✅ **Auto-eliminación** - El admin temporal se elimina cuando registras tu cuenta

## 🚀 Instalación y Primer Uso

### Paso 1: Instalar Dependencias

```bash
npm install
```

### Paso 2: Configurar Base de Datos

```bash
npx prisma migrate dev
```

**⚠️ IMPORTANTE:** Durante este paso, el sistema generará automáticamente las credenciales del administrador temporal. Presta atención a la salida del comando.

### Paso 3: Guardar las Credenciales

Después de ejecutar la migración, verás algo como esto:

```
═══════════════════════════════════════════════════════════════
✅ ADMINISTRADOR TEMPORAL CREADO CON CREDENCIALES ÚNICAS
═══════════════════════════════════════════════════════════════

📧 Email:      admin-a7f3d9@temp.local
🔑 Contraseña: Kx9#pL4mT2!qR7sW
🔐 Palabra Secreta de Recuperación: CLINICA3847AB

═══════════════════════════════════════════════════════════════
⚠️  IMPORTANTE - LEE ESTO CUIDADOSAMENTE:
═══════════════════════════════════════════════════════════════
1. 📋 COPIA Y GUARDA estas credenciales en un lugar seguro
2. 🔒 Estas credenciales son ÚNICAS para esta instalación
3. ⏰ Solo se muestran UNA VEZ - no se pueden recuperar
4. 👤 El primer usuario que se registre será el Administrador Principal
5. 🗑️  Este administrador temporal será eliminado automáticamente
6. 💡 Configura una palabra secreta al registrarte para recuperación futura
═══════════════════════════════════════════════════════════════

💾 Las credenciales también se guardaron en: .temp-admin-credentials.txt
```

**Las credenciales también se guardan en el archivo `.temp-admin-credentials.txt`** en la raíz del proyecto para tu referencia.

### Paso 4: Iniciar la Aplicación

```bash
npm run dev
```

### Paso 5: Primer Acceso

1. Abre `http://localhost:3000/login`
2. Usa las credenciales generadas (del paso 3)
3. Explora el sistema

### Paso 6: Crear tu Cuenta de Administrador

1. Ve a `http://localhost:3000/register`
2. Completa el formulario:

   - **Nombre y Apellido:** Tu información real
   - **Email:** Tu correo electrónico permanente
   - **Contraseña:** Una contraseña segura
   - **Palabra Secreta:** ⚠️ **MUY IMPORTANTE** - Una palabra que solo tú conozcas
   - **Rol:** Se asignará automáticamente como ADMIN

3. Al registrarte:
   - ❌ El administrador temporal será **eliminado**
   - ✅ Tu cuenta se convertirá en el **Administrador Principal**
   - 🔒 Las credenciales temporales dejarán de funcionar
   - 💾 Puedes borrar el archivo `.temp-admin-credentials.txt`

## 🔑 Sistema de Recuperación de Cuenta

### ¿Por qué es importante la Palabra Secreta?

La palabra secreta te permite recuperar tu cuenta si:

- ❌ Olvidaste tu contraseña
- ❌ Olvidaste tu email
- ❌ Perdiste acceso a tu cuenta

### Configurar una Buena Palabra Secreta

#### ✅ Ejemplos de Buenas Palabras Secretas:

- `MiClinicaDental2025`
- `RecuperacionSegura123`
- `PalabraSecretaClinica`
- `DENTAL4567XY`

#### ❌ Evita Estas Palabras Secretas:

- `123456` (demasiado simple)
- `password` (muy común)
- Tu contraseña actual (no uses la misma)
- Información personal obvia

### Recuperar tu Cuenta

Si olvidaste tus credenciales:

1. Ve a `http://localhost:3000/recover`
2. Ingresa:
   - Tu **email** (el que usaste para registrarte)
   - Tu **palabra secreta**
   - Tu **nueva contraseña**
3. Confirma la nueva contraseña
4. Haz clic en "Restablecer Contraseña"
5. Inicia sesión con tu nueva contraseña

## 📦 Para Vender el Proyecto

### Ventajas del Sistema de Credenciales Únicas

1. **Seguridad Garantizada:**

   - Cada cliente tiene credenciales diferentes
   - No hay riesgo de acceso no autorizado
   - Credenciales generadas con algoritmos seguros

2. **Fácil de Usar:**

   - El cliente solo ejecuta `npx prisma migrate dev`
   - Las credenciales se muestran automáticamente
   - Se guardan en un archivo para referencia

3. **Profesional:**
   - Sistema de seguridad robusto
   - Documentación clara
   - Experiencia de usuario premium

### Instrucciones para tus Clientes

Incluye esto en tu documentación de venta:

```markdown
## 🚀 Instalación Rápida

1. Instalar dependencias:
   npm install

2. Configurar base de datos:
   npx prisma migrate dev

   ⚠️ IMPORTANTE: Copia y guarda las credenciales que se muestran

3. Iniciar aplicación:
   npm run dev

4. Acceder con las credenciales generadas

5. Registrar tu cuenta de administrador
   - Ve a "Registrarse"
   - Completa el formulario
   - ⚠️ Configura una palabra secreta de recuperación
   - El admin temporal será eliminado automáticamente
```

## 🔧 Configuración Avanzada

### Personalizar la Generación de Credenciales

Si quieres modificar cómo se generan las credenciales, edita `prisma/seed.ts`:

```typescript
// Cambiar longitud de contraseña (por defecto: 16)
const tempAdminPassword = generateSecurePassword(20);

// Personalizar formato de email
function generateUniqueEmail(): string {
  const randomId = crypto.randomBytes(4).toString("hex");
  return `admin-${randomId}@tu-dominio.com`; // Cambia aquí
}
```

### Regenerar Credenciales

Si necesitas regenerar las credenciales:

```bash
# Esto eliminará TODOS los datos y regenerará credenciales
npx prisma migrate reset
```

⚠️ **ADVERTENCIA:** Esto borrará todos los datos de la base de datos.

## 📁 Archivos Importantes

- `prisma/seed.ts` - Script que genera las credenciales únicas
- `.temp-admin-credentials.txt` - Archivo temporal con las credenciales (no se sube a git)
- `app/api/auth/register/route.ts` - Lógica de reemplazo del admin temporal
- `app/api/auth/recover/route.ts` - Endpoint de recuperación de cuenta
- `app/recover/page.tsx` - Página de recuperación
- `app/register/page.tsx` - Formulario de registro con palabra secreta
- `app/login/page.tsx` - Página de login

## 🛡️ Seguridad

### Características de Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Palabras secretas hasheadas
- ✅ Credenciales únicas por instalación
- ✅ Generación criptográficamente segura
- ✅ Archivo de credenciales excluido de git
- ✅ Admin temporal auto-eliminable

### Formato de Credenciales Generadas

- **Email:** `admin-[8 caracteres hex]@temp.local`
  - Ejemplo: `admin-a7f3d9b2@temp.local`
- **Contraseña:** 16 caracteres aleatorios
  - Incluye: mayúsculas, minúsculas, números y símbolos
  - Ejemplo: `Kx9#pL4mT2!qR7sW`
- **Palabra Secreta:** Formato `[PALABRA][4 dígitos][2 hex]`
  - Ejemplo: `CLINICA3847AB`

## 🆘 Solución de Problemas

### No veo las credenciales generadas

1. Revisa el archivo `.temp-admin-credentials.txt` en la raíz del proyecto
2. Ejecuta nuevamente `npx prisma migrate reset` (⚠️ borrará datos)

### Olvidé las credenciales temporales

Si aún no has registrado tu cuenta:

1. Revisa `.temp-admin-credentials.txt`
2. Si no existe, ejecuta `npx prisma migrate reset`

### El admin temporal no funciona

1. Verifica que ejecutaste `npx prisma migrate dev`
2. Revisa que estás usando las credenciales correctas
3. Verifica que no se haya registrado ya un usuario (el admin temporal se elimina)

### Olvidé mi palabra secreta

Si olvidaste tu palabra secreta y no puedes acceder:

- Contacta al administrador del sistema
- Como último recurso: `npx prisma migrate reset` (⚠️ borrará todos los datos)

## 📊 Flujo Completo

```
Instalación
    ↓
npx prisma migrate dev
    ↓
Credenciales Únicas Generadas
    ↓
Guardadas en .temp-admin-credentials.txt
    ↓
Cliente accede con credenciales temporales
    ↓
Cliente registra su cuenta
    ↓
Admin temporal ELIMINADO
    ↓
Cliente es Administrador Principal
    ↓
Credenciales temporales YA NO FUNCIONAN
```

## 📝 Notas Importantes

1. **Una Sola Vez:** Las credenciales se generan solo una vez por instalación
2. **Únicas:** Cada instalación tiene credenciales diferentes
3. **Seguras:** Generadas con algoritmos criptográficos
4. **Temporales:** Se eliminan al registrar el primer usuario
5. **Recuperables:** Solo a través del archivo `.temp-admin-credentials.txt`

---

**Versión:** 2.0.0 (Credenciales Únicas)  
**Última actualización:** 2025-11-22  
**Seguridad:** Alta - Credenciales únicas por instalación
