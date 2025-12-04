# 🔒 Configuración de Seguridad del Proyecto

## Archivos Protegidos

Los siguientes archivos están bajo protección especial.
Modificarlos activará advertencias de seguridad:

### Críticos (Núcleo del SaaS)

- `lib/subscription.ts`
- `lib/subscription-plans.ts`
- `lib/stripe.ts`
- `prisma/schema.prisma`
- `app/api/stripe/checkout/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/subscription/route.ts`

### Configuración

- `.env`
- `vercel.json`
- `next.config.js`

## Sistema de Advertencias

Nivel 1 (⚠️ WARNING):

- Modificación de archivos de UI
- Cambios en estilos
- Nuevas funcionalidades sin tocar DB

Nivel 2 (🚨 CRITICAL):

- Modificación de schema de base de datos
- Cambios en sistema de suscripciones
- Alteración de lógica de autenticación
- Modificación de webhooks de Stripe

Nivel 3 (❌ BLOQUEADO):

- Comandos con --force-reset
- Eliminación de tablas
- Reset de migraciones sin backup

## Scripts de Verificación

```bash
# Verificar salud del sistema
npm run check-health

# Restaurar usuario de prueba
npm run restore-test-user
```

## Protocolo de Emergencia

Si algo se rompe:

1. NO ENTRAR EN PÁNICO
2. Ejecutar: `npm run check-health`
3. Ver el archivo: `CANDADO_PROTECCION_SISTEMA.md`
4. Seguir el plan de reversión

## Último Sistema Funcional

Fecha: 3 de Diciembre 2025
Commit: [ver git log]
Estado: ✅ 100% Funcional
