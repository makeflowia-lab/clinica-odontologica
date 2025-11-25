# 🗄️ Guía de Configuración de Base de Datos - Neon.tech

## Paso 1: Crear Cuenta en Neon.tech

1. Ir a [https://neon.tech](https://neon.tech)
2. Crear cuenta gratuita (con GitHub o email)
3. Crear nuevo proyecto con nombre "clinica-dental"

## Paso 2: Obtener Connection String

1. En el dashboard de Neon.tech, copiar el **Connection String**
2. El formato es: `postgresql://user:password@ep-xxxx-xxxxx.region.aws.neon.tech/neondb?sslmode=require`

## Paso 3: Configurar Variables de Entorno

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env` y reemplazar `DATABASE_URL` con tu connection string de Neon.tech

3. Configurar otras variables según necesites (opcionales para desarrollo inicial):
   - `JWT_SECRET`: Generar string aleatorio seguro
   - `STRIPE_SECRET_KEY` y `STRIPE_PUBLISHABLE_KEY`: De https://dashboard.stripe.com (modo test)
   - `OPENAI_API_KEY`: De https://platform.openai.com (para IA features)
   - Twilio, WhatsApp: Configurar según necesidad

## Paso 4: Instalar Dependencias de Prisma

```bash
# Ya instalado en el proyecto, pero si es necesario:
npm install prisma @prisma/client ts-node --save-dev
```

## Paso 5: Generar Cliente Prisma

```bash
npm run db:generate
```

Esto genera el cliente de Prisma basado en el schema.

## Paso 6: Ejecutar Migraciones

```bash
npm run db:push
```

Esto crea todas las tablas en tu base de datos Neon.tech.

## Paso 7: Poblar Base de Datos con Datos de Prueba

```bash
npm run db:seed
```

Esto crea:
- 4 usuarios de prueba (admin, 2 dentistas, 1 recepcionista)
- 3 pacientes de ejemplo
- Citas de prueba
- Inventario inicial
- Configuraciones del sistema

### Credenciales de Prueba

Después del seed, puedes iniciar sesión con:

```
Email: admin@clinica.com
Password: admin123

Email: dr.rodriguez@clinica.com
Password: admin123

Email: dra.martinez@clinica.com
Password: admin123

Email: recepcion@clinica.com
Password: admin123
```

## Paso 8: Verificar Base de Datos

Puedes abrir Prisma Studio para ver los datos:

```bash
npm run db:studio
```

Esto abre una interfaz web en `http://localhost:5555` donde puedes ver y editar datos.

## Comandos Útiles

```bash
# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos (CUIDADO: borra todos los datos)
npx prisma migrate reset

# Generar diagrama ER
npx prisma generate --schema prisma/schema.prisma
```

## Troubleshooting

### Error: P1001 - Can't reach database server

- Verificar que el `DATABASE_URL` en `.env` es correcto
- Verificar que el proyecto de Neon.tech está activo
- Verificar conexión a internet

### Error: P3009 - migrate.lock file should be committed

- Esto es normal en primera migración, ignore el warning

### Error de dependencias al instalar Prisma

- Ejecutar: `npm install --legacy-peer-deps`
- O usar: `npm install --force`

## Migración desde Neo4j (si aplica)

Si tienes datos en Neo4j que quieres migrar:

1. Exportar datos de Neo4j a JSON
2. Crear script de migración custom en `scripts/migrate-from-neo4j.ts`
3. Importar datos usando Prisma client

## Desarrollo Local vs Producción

### Local (Development)
- Usar Neon.tech free tier
- `NODE_ENV=development`
- Logs de Prisma activados

### Producción
- Usar Neon.tech paid plan con autoscaling
- `NODE_ENV=production`
- Connection pooling habilitado
- Backups automáticos configurados

## Conexión Pooling (Para Producción)

Neon.tech ofrece connection pooling automático. En tu `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Para migraciones
}
```

Y en `.env`:

```env
DATABASE_URL="postgresql://user:password@pooler.region.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxxx.region.neon.tech/neondb?sslmode=require"
```

## Recursos Adicionales

- [Prisma Docs](https://www.prisma.io/docs)
- [Neon.tech Docs](https://neon.tech/docs)
- [Neon.tech + Prisma Guide](https://neon.tech/docs/guides/prisma)

---

**¡Listo!** Tu base de datos está configurada y lista para usar. 🎉
