# 🔒 Checklist de Seguridad - Pull Request

## ⚠️ ANTES DE APROBAR ESTE PR

**LEE EL ARCHIVO:** `CANDADO_PROTECCION_SISTEMA.md`

---

## Verificación de Seguridad

- [ ] He leído el archivo de protección del sistema
- [ ] Este PR NO modifica `prisma/schema.prisma`
- [ ] Este PR NO modifica archivos en `lib/subscription*.ts`
- [ ] Este PR NO afecta el sistema de multi-tenancy
- [ ] Este PR NO cambia la lógica de Stripe
- [ ] He creado backup de los archivos modificados
- [ ] He probado localmente sin errores

---

## Impacto del Cambio

**¿Qué modifica este PR?**
- [ ] Solo UI/UX (seguro)
- [ ] Solo estilos (seguro)
- [ ] Nuevas funcionalidades sin tocar DB (revisar)
- [ ] Cambios en base de datos (⚠️ PELIGROSO)
- [ ] Cambios en suscripciones (⚠️ PELIGROSO)
- [ ] Cambios en autenticación (⚠️ PELIGROSO)

---

## ⚠️ Si marcaste algún cambio PELIGROSO:

**DEBES RESPONDER:**

1. ¿Por qué es necesario este cambio?
2. ¿Qué puede romperse?
3. ¿Cómo lo revertimos si falla?
4. ¿Creaste backup de los archivos originales?

---

## Plan de Reversión

**Si este PR rompe algo:**

```bash
# Comandos para revertir
git revert [commit-hash]
```

---

**RECUERDA:** Si el sistema funciona, no lo toques sin necesidad.
