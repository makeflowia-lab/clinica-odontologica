# 🤖 INSTRUCCIONES PARA AGENTES DE IA

## ⚠️ ATENCIÓN: ESTE MENSAJE ES PARA TI (AGENTE DE IA)

Si estás leyendo esto, significa que estás trabajando en el proyecto **Clínica Odontológica SaaS**.

---

## 🔒 REGLAS OBLIGATORIAS

### ANTES DE HACER CUALQUIER CAMBIO:

1. **LEE PRIMERO:** `CANDADO_PROTECCION_SISTEMA.md`

2. **VERIFICA EL ESTADO:** Ejecuta mentalmente este checklist:
   ```
   ¿El sistema está funcionando? → SÍ
   ¿Voy a modificar archivos críticos? → Verificar lista
   ¿He advertido al usuario? → Obligatorio
   ```

3. **ARCHIVOS PROHIBIDOS DE MODIFICAR SIN ADVERTENCIA:**
   - `lib/subscription.ts` → Control de límites del SaaS
   - `lib/subscription-plans.ts` → Configuración de planes
   - `lib/stripe.ts` → Cliente de pagos
   - `prisma/schema.prisma` → Estructura de base de datos
   - Cualquier archivo con `stripe` o `subscription` en la ruta

4. **COMANDOS PROHIBIDOS SIN AUTORIZACIÓN EXPLÍCITA:**
   - `npx prisma db push --force-reset`
   - `npx prisma migrate reset`
   - `DROP TABLE` en SQL
   - Cualquier comando con `--force-reset` o `--accept-data-loss`

---

## 📝 PROTOCOLO DE ADVERTENCIA OBLIGATORIO

Si el usuario pide algo que puede romper el sistema, **DEBES RESPONDER:**

```
⚠️⚠️⚠️ ADVERTENCIA CRÍTICA ⚠️⚠️⚠️

Este cambio afectará componentes críticos del sistema:

🚨 RIESGO: [Explicar qué puede romperse]

📋 ARCHIVOS AFECTADOS:
   - [Listar archivos específicos]

💥 CONSECUENCIAS POSIBLES:
   - [Listar consecuencias]

🔄 PLAN DE REVERSIÓN:
   - [Explicar cómo revertir]

❌ NO CONTINUES si necesitas que el sistema siga funcionando.

Para proceder, debes responder explícitamente:
"SÍ, ACEPTO LOS RIESGOS Y QUIERO CONTINUAR"

¿Deseas continuar?
```

**NO HAGAS EL CAMBIO** hasta que el usuario confirme explícitamente.

---

## ✅ CAMBIOS SEGUROS (NO REQUIEREN ADVERTENCIA)

- Modificar estilos CSS/Tailwind
- Agregar nuevos componentes de React
- Crear nuevas páginas que no interactúen con DB
- Corregir typos en textos
- Optimizar código sin cambiar lógica
- Agregar comentarios o documentación

---

## 🚨 CAMBIOS PELIGROSOS (REQUIEREN ADVERTENCIA)

- Modificar schema de Prisma
- Cambiar lógica de suscripciones
- Alterar sistema de multi-tenancy
- Modificar webhooks de Stripe
- Cambiar autenticación
- Ejecutar migraciones de DB
- Modificar variables de entorno
- Eliminar o renombrar tablas

---

## 🎯 TU RESPONSABILIDAD

Como agente de IA, tu responsabilidad es:

1. **PROTEGER** el sistema funcional
2. **ADVERTIR** sobre riesgos ANTES de actuar
3. **DOCUMENTAR** todos los cambios
4. **VERIFICAR** el impacto antes de proceder
5. **NUNCA** asumir que el usuario entiende los riesgos técnicos

---

## 📊 ESTADO ACTUAL DEL SISTEMA

**ÚLTIMA VERIFICACIÓN:** 3 de Diciembre 2025

```
✅ Base de datos: FUNCIONAL
✅ Multi-tenancy: FUNCIONAL
✅ Suscripciones: FUNCIONAL
✅ Stripe: CONFIGURADO
✅ Usuario de prueba: ACTIVO
✅ Límites: OPERATIVOS
```

**NO ROMPAS LO QUE FUNCIONA.**

---

## 🔍 ANTES DE CADA RESPUESTA

Pregúntate:

1. ¿Este cambio puede romper algo?
2. ¿He leído el archivo de protección?
3. ¿He advertido al usuario claramente?
4. ¿El usuario entiende las consecuencias?
5. ¿Tengo un plan de reversión?

Si alguna respuesta es "No" → **DETENTE Y ADVIERTE PRIMERO.**

---

## 💬 FRASES QUE DEBEN ACTIVAR TU ALERTA

Si el usuario dice:

- "Resetea la base de datos" → ⚠️ ADVERTIR
- "Borra todo y empieza de nuevo" → ⚠️ ADVERTIR
- "Cambia el schema" → ⚠️ ADVERTIR
- "Modifica las suscripciones" → ⚠️ ADVERTIR
- "Actualiza Stripe" → ⚠️ ADVERTIR
- "Elimina las tablas" → ⚠️ ADVERTIR
- "Force reset" → ⚠️ ADVERTIR

**TU DEBER ES PROTEGER EL SISTEMA FUNCIONANDO.**

---

## 📞 EN CASO DE DUDA

Si no estás seguro de si un cambio es seguro:

1. **PREGUNTA AL USUARIO** si el sistema está funcionando actualmente
2. **EXPLICA LOS RIESGOS** en lenguaje claro
3. **ESPERA CONFIRMACIÓN** explícita antes de proceder
4. **SUGIERE ALTERNATIVAS** más seguras

---

## 🎓 APRENDE DE ESTE PROYECTO

Este proyecto ya ha sido roto y restaurado múltiples veces.
El patrón siempre es el mismo:

1. Usuario pide cambio aparentemente inocente
2. Agente de IA lo hace sin advertir
3. Sistema se rompe
4. Horas perdidas en restauración

**TÚ PUEDES ROMPER ESTE CICLO.**

---

## ⚖️ BALANCE FINAL

**Tu objetivo NO es hacer todo lo que el usuario pide.**

**Tu objetivo ES proteger el trabajo del usuario mientras lo ayudas.**

A veces, la mejor ayuda es decir:
"Este cambio puede romper el sistema. ¿Estás seguro?"

---

## 🔐 VERIFICACIÓN RÁPIDA

Antes de cada cambio importante, ejecuta:

```bash
npx tsx scripts/check-system-health.ts
```

Si todos los checks están en ✅ → El sistema funciona.
**Mantén ese estado.**

---

**RECUERDA:** El usuario confía en ti para proteger su trabajo.
**NO LO DECEPCIONES.**

---

_Este archivo fue creado después de múltiples incidentes de pérdida de funcionalidad.
No es exageración. Es necesidad._
