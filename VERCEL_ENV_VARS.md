# 🚀 Configuración de Variables de Entorno en Vercel

## 📋 Variables REQUERIDAS

Estas variables son **obligatorias** para que la aplicación funcione:

### 1. Base de Datos (Neon PostgreSQL)

```env
DATABASE_URL=postgresql://usuario:password@host.neon.tech/database?sslmode=require
```

**Dónde obtenerla:**

- Ve a tu proyecto en [Neon.tech](https://neon.tech)
- Dashboard → Connection Details → Connection string
- Copia la URL completa con el password

### 2. JWT Secret

```env
JWT_SECRET=tu_secreto_jwt_minimo_32_caracteres_aleatorios
```

**Cómo generarlo:**

```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 3. JWT Expiration

```env
JWT_EXPIRES_IN=7d
```

### 4. Next Auth (para Vercel)

```env
NEXTAUTH_SECRET=otro_secreto_diferente_al_jwt_32_caracteres
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

**Nota:** `NEXTAUTH_URL` debe ser la URL completa de tu app en Vercel

### 5. App URL

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

---

## 📧 Variables OPCIONALES (Email)

Solo si quieres enviar notificaciones por email:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password_de_gmail
```

**Cómo obtener App Password de Gmail:**

1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (activar si no está activo)
3. App passwords → Genera una contraseña para "Mail"
4. Usa esa contraseña en `SMTP_PASSWORD`

---

## 💳 Variables OPCIONALES (Stripe - Pagos)

Solo si vas a procesar pagos:

```env
STRIPE_SECRET_KEY=sk_live_tu_clave_secreta
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_tu_clave_publica
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret
```

**Dónde obtenerlas:**

- [Stripe Dashboard](https://dashboard.stripe.com)
- Developers → API keys
- **Importante:** Usa claves de **producción** (live), no de test

---

## 📱 Variables OPCIONALES (Twilio - SMS)

Solo si quieres enviar SMS:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Dónde obtenerlas:**

- [Twilio Console](https://console.twilio.com)
- Account → Account SID y Auth Token
- Phone Numbers → Tu número activo

---

## 🤖 Variables OPCIONALES (OpenAI - Asistente IA)

Solo si quieres usar el asistente de voz IA:

```env
OPENAI_API_KEY=sk-proj-tu_clave_de_openai
```

**Dónde obtenerla:**

- [OpenAI Platform](https://platform.openai.com/api-keys)
- API keys → Create new secret key

---

## 🔧 Cómo Configurar en Vercel

### Opción 1: Interfaz Web (Recomendado)

1. Ve a tu proyecto en [Vercel](https://vercel.com)
2. Click en **Settings**
3. Click en **Environment Variables** (menú izquierdo)
4. Para cada variable:
   - **Key:** Nombre de la variable (ej: `DATABASE_URL`)
   - **Value:** Valor de la variable
   - **Environments:** Selecciona **Production**, **Preview**, y **Development**
   - Click en **Add**

### Opción 2: Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Configurar variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add NEXT_PUBLIC_APP_URL production
```

---

## ✅ Checklist de Configuración

### Variables Requeridas

- [ ] `DATABASE_URL` - URL de Neon PostgreSQL
- [ ] `JWT_SECRET` - Secreto generado (32+ caracteres)
- [ ] `JWT_EXPIRES_IN` - "7d"
- [ ] `NEXTAUTH_SECRET` - Otro secreto diferente
- [ ] `NEXTAUTH_URL` - URL de Vercel (https://...)
- [ ] `NEXT_PUBLIC_APP_URL` - URL de Vercel (https://...)

### Variables Opcionales (según necesites)

- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email
- [ ] `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Pagos
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - SMS
- [ ] `OPENAI_API_KEY` - Asistente IA

---

## 🔄 Después de Configurar Variables

1. **Redeploy** tu aplicación:

   - Ve a Deployments
   - Click en los tres puntos del último deployment
   - Click en "Redeploy"
   - **IMPORTANTE:** Desmarcar "Use existing Build Cache"

2. **Verificar** que las variables se cargaron:
   - En los logs de build, busca errores de variables faltantes
   - No deberías ver mensajes como "Missing environment variable"

---

## 🚨 Errores Comunes

### Error: "Missing DATABASE_URL"

**Solución:** Verifica que configuraste `DATABASE_URL` en Vercel y que seleccionaste "Production"

### Error: "Invalid JWT_SECRET"

**Solución:** Asegúrate de que `JWT_SECRET` tenga al menos 32 caracteres

### Error: "NEXTAUTH_URL must be a valid URL"

**Solución:** `NEXTAUTH_URL` debe empezar con `https://` y ser tu dominio de Vercel

### Error: "Cannot connect to database"

**Solución:**

- Verifica que la `DATABASE_URL` sea correcta
- Asegúrate de que incluya `?sslmode=require` al final
- Verifica que tu base de datos Neon esté activa

---

## 📝 Ejemplo Completo (Solo Variables Requeridas)

```env
# Base de Datos
DATABASE_URL=postgresql://neondb_owner:abc123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRES_IN=7d

# NextAuth
NEXTAUTH_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
NEXTAUTH_URL=https://clinica-odontologica.vercel.app

# App URL
NEXT_PUBLIC_APP_URL=https://clinica-odontologica.vercel.app
```

---

## 🎯 Próximo Paso

Después de configurar las variables de entorno:

1. ✅ Variables configuradas en Vercel
2. ⏭️ Redeploy sin build cache
3. ⏭️ Verificar que el build sea exitoso
4. ⏭️ Probar login en producción

---

**¿Listo para redeploy?** 🚀

Una vez que hayas configurado todas las variables requeridas, el siguiente paso es hacer redeploy en Vercel.
