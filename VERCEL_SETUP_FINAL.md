# 🔐 Variables de Entorno Generadas para Vercel

**IMPORTANTE:** Estas son las variables que debes configurar en Vercel.

---

## ✅ VARIABLES REQUERIDAS (Copiar a Vercel)

### 1. Secretos JWT (Ya Generados)

```env
JWT_SECRET=aeefe30007024898a9166133f2b4d15b3a315d78c6d765d82ef153977b4007e7
NEXTAUTH_SECRET=d6595f41d30ef81136d4d64d9d68253ab23b4ce4979c1449db5956173fa34896
JWT_EXPIRES_IN=7d
```

### 2. Database URL (DEBES COMPLETAR)

```env
DATABASE_URL=postgresql://TU_USUARIO:TU_PASSWORD@TU_HOST.neon.tech/TU_DATABASE?sslmode=require
```

**Dónde obtenerla:**

- Ve a [Neon.tech](https://neon.tech) → Tu proyecto
- Dashboard → Connection Details
- Copia la "Connection string" completa

### 3. URLs de la Aplicación (DEBES COMPLETAR)

```env
NEXTAUTH_URL=https://TU-DOMINIO.vercel.app
NEXT_PUBLIC_APP_URL=https://TU-DOMINIO.vercel.app
```

**Reemplaza `TU-DOMINIO` con:**

- El dominio que Vercel te asignó (ej: `clinica-odontologica-abc123.vercel.app`)
- O tu dominio personalizado si configuraste uno

---

## 📋 INSTRUCCIONES PASO A PASO

### Paso 1: Ir a Vercel

1. Abre [vercel.com](https://vercel.com)
2. Ve a tu proyecto `clinica-odontologica`
3. Click en **Settings**
4. Click en **Environment Variables**

### Paso 2: Agregar Variables Requeridas

Para cada variable, haz lo siguiente:

#### Variable 1: JWT_SECRET

- **Key:** `JWT_SECRET`
- **Value:** `aeefe30007024898a9166133f2b4d15b3a315d78c6d765d82ef153977b4007e7`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Add**

#### Variable 2: NEXTAUTH_SECRET

- **Key:** `NEXTAUTH_SECRET`
- **Value:** `d6595f41d30ef81136d4d64d9d68253ab23b4ce4979c1449db5956173fa34896`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Add**

#### Variable 3: JWT_EXPIRES_IN

- **Key:** `JWT_EXPIRES_IN`
- **Value:** `7d`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Add**

#### Variable 4: DATABASE_URL

- **Key:** `DATABASE_URL`
- **Value:** (Copia de Neon.tech - ver arriba)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Add**

#### Variable 5: NEXTAUTH_URL

- **Key:** `NEXTAUTH_URL`
- **Value:** `https://TU-DOMINIO.vercel.app` (reemplaza TU-DOMINIO)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Add**

#### Variable 6: NEXT_PUBLIC_APP_URL

- **Key:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://TU-DOMINIO.vercel.app` (mismo que NEXTAUTH_URL)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- Click **Add**

### Paso 3: Redeploy

1. Ve a **Deployments**
2. Click en los **tres puntos (...)** del último deployment
3. Click en **Redeploy**
4. **⚠️ IMPORTANTE:** Desmarcar **"Use existing Build Cache"**
5. Click en **Redeploy**

### Paso 4: Verificar Build

Espera a que termine el build y busca:

```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Generated Prisma Client (5.10.2)
✓ Compiled successfully
```

Si ves estos mensajes, ¡el deployment fue exitoso! ✅

---

## 🎯 Checklist Final

- [ ] Obtuve `DATABASE_URL` de Neon.tech
- [ ] Identifiqué mi dominio de Vercel
- [ ] Agregué `JWT_SECRET` en Vercel
- [ ] Agregué `NEXTAUTH_SECRET` en Vercel
- [ ] Agregué `JWT_EXPIRES_IN` en Vercel
- [ ] Agregué `DATABASE_URL` en Vercel
- [ ] Agregué `NEXTAUTH_URL` en Vercel
- [ ] Agregué `NEXT_PUBLIC_APP_URL` en Vercel
- [ ] Hice Redeploy sin build cache
- [ ] El build fue exitoso
- [ ] Probé acceder a la app en producción

---

## 🚨 Si Algo Sale Mal

### Error: "Missing DATABASE_URL"

- Verifica que copiaste la variable correctamente
- Asegúrate de seleccionar "Production" en Environments

### Error: "Cannot connect to database"

- Verifica que la URL de Neon incluya `?sslmode=require`
- Asegúrate de que tu base de datos Neon esté activa

### Error: "Build failed"

- Revisa los logs completos en Vercel
- Busca mensajes de error específicos
- Consulta `VERCEL_DEPLOYMENT.md` para troubleshooting

---

## 📞 Siguiente Paso

Una vez que el deployment sea exitoso:

1. **Accede a tu app:** `https://TU-DOMINIO.vercel.app`
2. **Prueba el login:** `admin@clinica.com` / `admin123`
3. **Verifica que todo funcione**
4. **Prueba en móvil** para verificar el menú hamburguesa

---

**¡Todo listo para producción! 🎉**
