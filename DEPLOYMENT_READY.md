# 🚀 Script de Deployment Automático para Vercel

## Variables de Entorno Generadas

### Secretos JWT (Ya Generados)

```
JWT_SECRET=aeefe30007024898a9166133f2b4d15b3a315d78c6d765d82ef153977b4007e7
NEXTAUTH_SECRET=d6595f41d30ef81136d4d64d9d68253ab23b4ce4979c1449db5956173fa34896
JWT_EXPIRES_IN=7d
```

## 📋 Instrucciones para Configurar Vercel

### Opción 1: Interfaz Web de Vercel (Más Fácil)

1. Ve a [vercel.com](https://vercel.com) y abre tu proyecto `clinica-odontologica`
2. Click en **Settings** → **Environment Variables**
3. Agrega las siguientes variables (una por una):

#### Variables REQUERIDAS:

**JWT_SECRET**

- Key: `JWT_SECRET`
- Value: `aeefe30007024898a9166133f2b4d15b3a315d78c6d765d82ef153977b4007e7`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**NEXTAUTH_SECRET**

- Key: `NEXTAUTH_SECRET`
- Value: `d6595f41d30ef81136d4d64d9d68253ab23b4ce4979c1449db5956173fa34896`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**JWT_EXPIRES_IN**

- Key: `JWT_EXPIRES_IN`
- Value: `7d`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**DATABASE_URL**

- Key: `DATABASE_URL`
- Value: (Copia de tu archivo .env local - la URL de Neon)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**NEXTAUTH_URL**

- Key: `NEXTAUTH_URL`
- Value: `https://TU-DOMINIO.vercel.app` (reemplaza con tu dominio real)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**NEXT_PUBLIC_APP_URL**

- Key: `NEXT_PUBLIC_APP_URL`
- Value: `https://TU-DOMINIO.vercel.app` (mismo que NEXTAUTH_URL)
- Environments: ✅ Production, ✅ Preview, ✅ Development

### Opción 2: Vercel CLI (Más Rápido)

Si tienes Vercel CLI instalado:

```bash
# Login a Vercel
vercel login

# Link al proyecto
vercel link

# Agregar variables de entorno
vercel env add JWT_SECRET production
# Pega: aeefe30007024898a9166133f2b4d15b3a315d78c6d765d82ef153977b4007e7

vercel env add NEXTAUTH_SECRET production
# Pega: d6595f41d30ef81136d4d64d9d68253ab23b4ce4979c1449db5956173fa34896

vercel env add JWT_EXPIRES_IN production
# Pega: 7d

vercel env add DATABASE_URL production
# Pega tu URL de Neon

vercel env add NEXTAUTH_URL production
# Pega: https://tu-dominio.vercel.app

vercel env add NEXT_PUBLIC_APP_URL production
# Pega: https://tu-dominio.vercel.app
```

## 🔄 Después de Configurar Variables

1. Ve a **Deployments** en Vercel
2. Click en los **tres puntos (...)** del último deployment
3. Click en **Redeploy**
4. **⚠️ IMPORTANTE:** Desmarcar **"Use existing Build Cache"**
5. Click en **Redeploy**

## ✅ Verificación

Después del deployment, verifica:

1. **Build exitoso**: Busca `✓ Generated Prisma Client` en los logs
2. **Acceso a la app**: Abre tu dominio de Vercel
3. **Login funcional**: Prueba con `admin@clinica.com` / `admin123`
4. **Registro funcional**: Crea un nuevo usuario
5. **Datos sincronizados**: Los usuarios deben aparecer en Neon

## 🎯 Estado Actual

- ✅ Código pusheado a GitHub (commit: 950301c)
- ✅ Prisma configurado para Vercel
- ✅ JWT secrets generados
- ✅ Base de datos Neon funcionando
- ⏳ Pendiente: Configurar variables en Vercel
- ⏳ Pendiente: Redeploy

## 📞 Siguiente Paso

**Configura las variables de entorno en Vercel** usando la Opción 1 (interfaz web) o la Opción 2 (CLI), luego haz redeploy.

Una vez que el deployment esté completo, tu aplicación estará en producción con todos los cambios sincronizados! 🚀
