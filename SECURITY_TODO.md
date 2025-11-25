# 🔒 SEGURIDAD DE API KEYS - IMPLEMENTACIÓN REQUERIDA PARA PRODUCCIÓN

## ⚠️ PROBLEMA ACTUAL (DESARROLLO)

Actualmente las API keys se guardan en `localStorage` del navegador. Esto es **INSEGURO** para producción:

❌ Se puede ver en DevTools  
❌ Cualquier script puede accederla  
❌ Se envía desde el cliente  
❌ No hay encriptación

## ✅ SOLUCIÓN PARA PRODUCCIÓN

### 1. **Crear endpoint de API Key** (`/api/settings/api-key`)

```typescript
// app/api/settings/api-key/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Función para encriptar (AES-256)
function encrypt(text: string): string {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes en hex
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

// Función para desencriptar
function decrypt(encryptedText: string): string {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// POST - Guardar API key del cliente
export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    // TODO: Obtener ID del usuario autenticado desde JWT/session
    const userId = "user123"; // Placeholder

    // Validar formato
    if (!apiKey || !apiKey.startsWith("sk-")) {
      return NextResponse.json({ error: "API key inválida" }, { status: 400 });
    }

    // Encriptar
    const encryptedKey = encrypt(apiKey);

    // Guardar en base de datos (Neo4j o tu BD)
    // await db.query(`
    //   MATCH (u:User {id: $userId})
    //   SET u.openai_api_key_encrypted = $encryptedKey,
    //       u.api_key_last_updated = datetime()
    // `, { userId, encryptedKey });

    // Mostrar solo últimos 4 dígitos
    const maskedKey = `sk-...${apiKey.slice(-4)}`;

    return NextResponse.json({
      success: true,
      message: "API key guardada de forma segura",
      maskedKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al guardar API key" },
      { status: 500 }
    );
  }
}

// GET - Verificar si existe API key (no devolver la key completa)
export async function GET(request: NextRequest) {
  try {
    // TODO: Obtener ID del usuario autenticado
    const userId = "user123";

    // Consultar si existe
    // const result = await db.query(`
    //   MATCH (u:User {id: $userId})
    //   RETURN u.openai_api_key_encrypted IS NOT NULL as hasKey
    // `, { userId });

    return NextResponse.json({
      hasKey: true, // Placeholder
      maskedKey: "sk-...****",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al verificar API key" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar API key
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Obtener ID del usuario autenticado
    const userId = "user123";

    // Eliminar de BD
    // await db.query(`
    //   MATCH (u:User {id: $userId})
    //   REMOVE u.openai_api_key_encrypted
    // `, { userId });

    return NextResponse.json({
      success: true,
      message: "API key eliminada",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar API key" },
      { status: 500 }
    );
  }
}
```

### 2. **Actualizar frontend** (layout.tsx)

```typescript
// Guardar API key (enviar al backend)
const saveApiKey = async () => {
  try {
    const response = await fetch("/api/settings/api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: userApiKey }),
    });

    const data = await response.json();

    if (data.success) {
      setApiKeyConfigured(true);
      setUserApiKey(""); // Limpiar del estado
      alert(
        `✅ API key guardada de forma segura\n\nSe mostrará como: ${data.maskedKey}`
      );
    }
  } catch (error) {
    alert("❌ Error al guardar API key");
  }
};

// Verificar al cargar
useEffect(() => {
  fetch("/api/settings/api-key")
    .then((r) => r.json())
    .then((data) => {
      if (data.hasKey) {
        setApiKeyConfigured(true);
      }
    });
}, []);
```

### 3. **Modificar endpoints de análisis**

```typescript
// app/api/voice-assistant/route.ts
export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    // Obtener usuario autenticado
    const userId = await getUserFromSession(request);

    // Obtener API key del usuario desde BD (desencriptada)
    const userApiKey = await getUserApiKey(userId);

    // Si no tiene, usar la del servidor (para demos)
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;

    // ... resto del código
  }
}
```

### 4. **Variables de entorno requeridas**

```env
# .env
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=64_caracteres_hexadecimales_aqui

# API key del servidor (solo para demos/onboarding)
OPENAI_API_KEY=sk-proj-...
```

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Generar `ENCRYPTION_KEY` de 32 bytes
- [ ] Crear endpoint `/api/settings/api-key` (POST, GET, DELETE)
- [ ] Implementar funciones de encriptación AES-256-GCM
- [ ] Agregar campo `openai_api_key_encrypted` en el modelo de User
- [ ] Modificar frontend para usar el endpoint
- [ ] Actualizar endpoints de análisis para obtener key desde BD
- [ ] Implementar middleware de autenticación JWT
- [ ] Agregar rate limiting por usuario
- [ ] Logs de auditoría para cambios de API key
- [ ] Testing de seguridad

## 🔐 MEJORES PRÁCTICAS

1. **Nunca** devolver la API key completa al frontend
2. Mostrar solo: `sk-...últimos4dígitos`
3. Usar HTTPS obligatorio en producción
4. Rotar la `ENCRYPTION_KEY` periódicamente
5. Implementar rate limiting por usuario
6. Logs de auditoría para detectar uso anómalo
7. Permitir que el usuario revoque/regenere su key
8. Validar que la API key funcione antes de guardarla

## 🚀 MIGRACIÓN DE DESARROLLO A PRODUCCIÓN

1. Crear script de migración para eliminar keys de localStorage
2. Forzar re-ingreso de API keys en primer login post-producción
3. Notificar a usuarios del cambio de seguridad
4. Documentar el proceso en onboarding

---

**ESTADO ACTUAL:** Solo para desarrollo con localStorage  
**REQUERIDO PARA:** Producción con clientes reales  
**PRIORIDAD:** 🔴 Alta - Seguridad crítica
