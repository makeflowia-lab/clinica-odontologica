# 🚀 Inicio Rápido - Clínica Dental SaaS

## ⚡ Configuración Rápida (5 minutos)

### 1️⃣ Instalar Neo4j Desktop

**Windows (PowerShell como Administrador):**
```powershell
# Opción A: Descargar instalador
Start-Process "https://neo4j.com/download/"

# Opción B: Con Chocolatey (si está instalado)
choco install neo4j-desktop
```

**Después de instalar:**
1. Abrir Neo4j Desktop
2. Crear nuevo proyecto: "Clinica Dental"
3. Agregar nueva base de datos (Graph DBMS):
   - Nombre: `clinica-db`
   - Contraseña: `password` (o la que prefieras)
   - Versión: 5.x
4. **Iniciar** la base de datos (botón Start)
5. Verificar que corra en `neo4j://localhost:7687`

### 2️⃣ Configurar Variables de Entorno

El archivo `.env` ya está creado. **Editar solo si cambiaste la contraseña de Neo4j:**

```powershell
# Abrir .env en VS Code
code .env
```

Actualizar línea:
```env
NEO4J_PASSWORD=tu_contraseña_neo4j
```

### 3️⃣ Inicializar Base de Datos

```powershell
npm run init-db
```

Esto creará:
- ✅ Constraints e índices en Neo4j
- ✅ Usuario admin: `admin@clinica.com` / `admin123`
- ✅ Materiales de ejemplo

### 4️⃣ Arrancar Servidor de Desarrollo

```powershell
npm run dev
```

Abrir navegador en: **http://localhost:3000**

---

## 🧪 Pruebas Rápidas

### Registrar Usuario
1. Ir a http://localhost:3000/register
2. Crear cuenta (rol: ADMIN, DENTIST o RECEPTIONIST)

### Iniciar Sesión
1. Usar: `admin@clinica.com` / `admin123`
2. O tu usuario recién creado

### APIs de Prueba (Postman/Thunder Client)

**Login:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@clinica.com",
  "password": "admin123"
}
```

Respuesta incluye `token` → copiar para siguientes requests.

**Crear Paciente:**
```http
POST http://localhost:3000/api/patients
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "555-1234",
  "dateOfBirth": "1990-05-15",
  "gender": "M",
  "email": "juan@example.com"
}
```

**Listar Pacientes:**
```http
GET http://localhost:3000/api/patients?search=Juan
Authorization: Bearer TU_TOKEN_AQUI
```

**Crear Cita:**
```http
POST http://localhost:3000/api/appointments
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json

{
  "patientId": "UUID_DEL_PACIENTE",
  "dentistId": "UUID_DEL_DENTISTA",
  "dateTime": "2025-11-20T10:00:00Z",
  "duration": 30,
  "type": "CONSULTATION",
  "notes": "Primera consulta"
}
```

**Agente de Voz IA:**
```http
POST http://localhost:3000/api/voice
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json

{
  "transcript": "Crear paciente María García, teléfono 555-9876"
}
```

---

## 🔧 Troubleshooting

### Error: Cannot connect to Neo4j
```
❌ Error: Could not connect to neo4j://localhost:7687
```

**Solución:**
1. Verificar que Neo4j Desktop esté corriendo
2. Revisar URI/password en `.env`
3. Ping a Neo4j:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 7687
   ```

### Error: OPENAI_API_KEY not set
```
❌ Error: Missing OpenAI API key
```

**Solución temporal (sin agente de voz):**
- Comentar rutas de `/api/voice` en tu código
- O agregar API key en `.env`:
  ```env
  OPENAI_API_KEY=sk-proj-tu_clave_real
  ```
  Obtener en: https://platform.openai.com/api-keys

### Dependencias faltantes
```powershell
npm install --legacy-peer-deps
```

### Puerto 3000 ocupado
```powershell
# Cambiar puerto en dev
$env:PORT=3001; npm run dev
```

---

## 📊 Explorar Neo4j (opcional)

1. Abrir Neo4j Browser: http://localhost:7474
2. Login con credenciales de `.env`
3. Ejecutar consultas Cypher:

```cypher
// Ver todos los nodos
MATCH (n) RETURN n LIMIT 25

// Ver pacientes
MATCH (p:Patient) RETURN p

// Ver relaciones
MATCH (a:Appointment)-[r]->(n) RETURN a, r, n LIMIT 10
```

---

## 🎯 Siguiente Paso

Explorar el código en:
- `app/api/` - APIs REST
- `lib/neo4j.ts` - Cliente Neo4j
- `types/index.ts` - Tipos TypeScript
- `README.md` - Documentación completa

¡Listo para desarrollar! 🚀
