# 🚀 Guía de Deployment en Vercel - Clínica Odontológica

**Fecha:** 2025-11-25  
**Estado:** ✅ Configuración corregida

---

## ✅ PROBLEMA RESUELTO

### Error Original

```
PrismaClientInitializationError: Prisma has detected that this project was built on Vercel,
which caches dependencies. This leads to an outdated Prisma Client because Prisma's
auto-generation isn't triggered.
```

### Solución Implementada

Se realizaron los siguientes cambios en `package.json`:

#### 1. **Script de Build Actualizado**

```json
"build": "prisma generate && next build"
```

Ahora genera el Prisma Client antes de compilar Next.js.

#### 2. **Script Postinstall Agregado**

```json
"postinstall": "prisma generate"
```

Genera automáticamente el Prisma Client después de instalar dependencias.

#### 3. **Prisma Movido a Dependencies**

Movimos `@prisma/client` y `prisma` de `devDependencies` a `dependencies` para que Vercel los incluya en producción.

---

## 📋 PASOS PARA DEPLOYMENT EN VERCEL

### 1. **Commit y Push de los Cambios**

```bash
git add package.json
git commit -m "fix: Configure Prisma for Vercel deployment"
git push origin main
```

### 2. **Configurar Variables de Entorno en Vercel**

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

#### **Base de Datos (Neon PostgreSQL)**

```env
DATABASE_URL=postgresql://usuario:password@host/database?sslmode=require
```

#### **Autenticación**

```env
JWT_SECRET=tu_secreto_jwt_aqui_minimo_32_caracteres
NEXTAUTH_SECRET=tu_secreto_nextauth_aqui
NEXTAUTH_URL=https://tu-dominio.vercel.app
```

#### **Email (Opcional - para notificaciones)**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password
SMTP_FROM=noreply@tu-dominio.com
```

#### **Twilio (Opcional - para SMS)**

```env
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### **Stripe (Opcional - para pagos)**

```env
STRIPE_SECRET_KEY=sk_live_tu_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_tu_stripe_public
```

#### **OpenAI (Opcional - para asistente IA)**

```env
OPENAI_API_KEY=sk-proj-tu_openai_api_key
```

### 3. **Configurar Build Settings en Vercel**

En tu proyecto de Vercel → Settings → General:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (ya incluye `prisma generate`)
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 4. **Redeploy**

Después de configurar las variables de entorno:

1. Ve a Deployments
2. Click en los tres puntos del último deployment
3. Click en "Redeploy"
4. Selecciona "Use existing Build Cache" → **NO** (desmarcar)
5. Click en "Redeploy"

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

### 1. **Verificar Build Logs**

Busca en los logs de build:

```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Generated Prisma Client
```

### 2. **Verificar Conexión a Base de Datos**

Accede a: `https://tu-dominio.vercel.app/api/health` (si tienes un endpoint de health check)

### 3. **Probar Login**

1. Ve a `https://tu-dominio.vercel.app/login`
2. Intenta hacer login con: `admin@clinica.com` / `admin123`

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot connect to database"

**Causa:** DATABASE_URL incorrecta o base de datos no accesible desde Vercel.

**Solución:**

1. Verifica que tu base de datos Neon esté configurada para aceptar conexiones externas
2. Asegúrate de que el `DATABASE_URL` incluya `?sslmode=require`
3. Verifica que la variable de entorno esté configurada en Vercel

### Error: "Prisma Client not generated"

**Causa:** El build cache de Vercel está usando una versión antigua.

**Solución:**

1. Ve a Vercel → Deployments
2. Redeploy sin usar el build cache (desmarcar "Use existing Build Cache")

### Error: "Module not found: Can't resolve '@prisma/client'"

**Causa:** Prisma no está en dependencies.

**Solución:**

1. Verifica que `@prisma/client` y `prisma` estén en `dependencies` (no en `devDependencies`)
2. Commit y push los cambios
3. Redeploy

### Error de CORS o API Routes no funcionan

**Causa:** Configuración de Next.js o variables de entorno.

**Solución:**

1. Verifica que `NEXTAUTH_URL` apunte a tu dominio de Vercel
2. Asegúrate de que todas las API routes estén en `app/api/`

---

## 📊 MIGRACIONES DE BASE DE DATOS

### Opción 1: Usar Prisma Migrate (Recomendado)

```bash
# En tu máquina local
npx prisma migrate deploy
```

Esto aplicará todas las migraciones pendientes a tu base de datos de producción.

### Opción 2: Usar Prisma DB Push (Desarrollo)

```bash
# Solo para desarrollo/testing
npx prisma db push
```

**⚠️ Advertencia:** `db push` no crea archivos de migración y puede causar pérdida de datos.

---

## 🔐 SEGURIDAD EN PRODUCCIÓN

### Variables de Entorno Sensibles

✅ **Nunca** commitees archivos `.env` al repositorio  
✅ Usa variables de entorno diferentes para desarrollo y producción  
✅ Rota secretos regularmente (JWT_SECRET, API keys, etc.)

### Recomendaciones

1. **JWT_SECRET:** Genera uno seguro:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **HTTPS:** Vercel proporciona HTTPS automáticamente

3. **Rate Limiting:** Considera implementar rate limiting en API routes

4. **CORS:** Configura CORS apropiadamente para tu dominio

---

## 📝 CHECKLIST DE DEPLOYMENT

- [x] `package.json` actualizado con `prisma generate` en build
- [x] `@prisma/client` y `prisma` en `dependencies`
- [x] Script `postinstall` agregado
- [ ] Variables de entorno configuradas en Vercel
- [ ] `DATABASE_URL` apuntando a base de datos de producción
- [ ] Migraciones aplicadas a base de datos de producción
- [ ] Usuario admin creado en base de datos de producción
- [ ] Build exitoso en Vercel
- [ ] Login funcional en producción
- [ ] API routes funcionando correctamente
- [ ] Conexión a base de datos verificada

---

## 🎯 PRÓXIMOS PASOS

1. **Commit y Push** los cambios de `package.json`
2. **Configurar variables de entorno** en Vercel
3. **Redeploy** sin build cache
4. **Verificar** que el deployment sea exitoso
5. **Probar** login y funcionalidades básicas
6. **Aplicar migraciones** si es necesario
7. **Crear usuario admin** en producción (si no existe)

---

## 📞 RECURSOS ÚTILES

- [Documentación de Prisma en Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Neon PostgreSQL](https://neon.tech/docs/introduction)

---

**¡Listo para deployment! 🚀**

Si encuentras algún error, revisa los logs de build en Vercel y consulta la sección de Troubleshooting.
