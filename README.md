# 🦷 Clínica Dental SaaS

Sistema completo de gestión para clínicas dentales construido con **Next.js**, **Neo4j** (base de datos gráfica) y **OpenAI** (agente de voz IA).

## ✨ Características Principales

### Gestión Clínica
- 📅 **Agenda Multiusuario**: Citas para múltiples dentistas/salas con detección de conflictos
- 👥 **Gestión de Pacientes**: Historiales completos, datos demográficos, alergias, condiciones médicas
- 🦷 **Odontograma Digital**: Visualización interactiva del estado dental
- 📋 **Historiales Clínicos**: Diagnósticos, planes de tratamiento, notas y adjuntos
- 💊 **Tratamientos**: Seguimiento completo de procedimientos, costos y resultados

### Gestión Administrativa
- 💰 **Facturación Integrada**: Generación de facturas, control de pagos, integración con Stripe
- 📦 **Inventario**: Control de materiales, insumos, alertas de stock bajo
- 📊 **Reportes y Analytics**: Dashboard con KPIs financieros y operacionales
- 🔔 **Recordatorios Automáticos**: SMS (Twilio) y Email (SMTP) para citas
- 👨‍⚕️ **Roles y Permisos**: Admin, Dentista, Recepcionista con acceso diferenciado

### Tecnología Avanzada
- 🗄️ **Neo4j (Base de Datos Gráfica)**: Consultas complejas sobre relaciones (pacientes ↔ tratamientos ↔ materiales)
- 🎙️ **Agente de Voz IA**: Comandos de voz para crear pacientes, agendar citas, buscar información
- 🔐 **Seguridad**: JWT authentication, bcrypt, cumplimiento HIPAA/GDPR
- 📱 **Responsivo**: Compatible con móviles, tablets y escritorio

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Neo4j Driver
- **Base de Datos**: Neo4j (gráfica) + opcional PostgreSQL (transaccional)
- **Autenticación**: JWT + bcrypt
- **Pagos**: Stripe
- **Notificaciones**: Twilio (SMS) + Nodemailer (Email)
- **IA**: OpenAI GPT-4 (agente de voz)

## 📋 Requisitos Previos

- Node.js 18+ 
- Neo4j 5.x (Desktop o servidor)
- Cuenta Stripe (modo test para desarrollo)
- Cuenta Twilio (opcional, para SMS)
- Cuenta OpenAI (para agente de voz)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```powershell
cd D:\
git clone <repo-url> clinica-odon
cd clinica-odon
```

### 2. Instalar dependencias
```powershell
npm install
```

### 3. Configurar Neo4j

**Opción A: Neo4j Desktop (recomendado para desarrollo)**
1. Descargar [Neo4j Desktop](https://neo4j.com/download/)
2. Crear un nuevo proyecto y base de datos
3. Iniciar la base de datos (por defecto: `neo4j://localhost:7687`)
4. Configurar usuario/contraseña (por defecto: `neo4j/neo4j`, cambiar en primer acceso)

**Opción B: Neo4j AuraDB (Cloud)**
1. Crear cuenta en [Neo4j Aura](https://neo4j.com/cloud/aura/)
2. Crear instancia gratuita
3. Guardar URI de conexión y credenciales

### 4. Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```powershell
Copy-Item .env.example .env
```

Editar `.env` con tus credenciales:

```env
# Neo4j
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tu_contraseña_neo4j

# JWT
JWT_SECRET=genera_un_secreto_aleatorio_aqui

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password

# Twilio (SMS)
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe
STRIPE_SECRET_KEY=sk_test_tu_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_stripe_public

# OpenAI
OPENAI_API_KEY=sk-tu_openai_api_key
```

### 5. Inicializar Base de Datos Neo4j

Ejecutar el script de inicialización (crea constraints e índices):

```powershell
npm run dev
```

Luego en otra terminal:

```powershell
node scripts/init-neo4j.js
```

O acceder a `http://localhost:3000/api/init` (endpoint de inicialización).

### 6. Desarrollo

```powershell
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📖 Uso del Sistema

### Registro de Usuario

1. Ir a `/register`
2. Crear cuenta con rol (ADMIN, DENTIST, RECEPTIONIST)
3. Iniciar sesión en `/login`

### Crear Paciente

**Opción 1: Interfaz Web**
- Dashboard → Pacientes → Nuevo Paciente

**Opción 2: Agente de Voz**
- Click en ícono de micrófono
- Di: *"Crear paciente Juan Pérez, teléfono 555-1234, correo juan@example.com"*

### Agendar Cita

**Por Voz:**
- *"Agendar cita para María García mañana a las 10 AM, limpieza dental"*

**Por Interfaz:**
- Agenda → Nueva Cita → Seleccionar paciente, dentista, fecha y tipo

### Consultas Avanzadas Neo4j

Ejemplos de consultas en Cypher (Neo4j Browser):

```cypher
// Pacientes con implantes que tuvieron complicaciones
MATCH (p:Patient)-[:RECEIVED]->(t:Treatment {name: 'Implante'})-[:USED]->(m:Material)
WHERE t.complications IS NOT NULL
RETURN p.firstName, p.lastName, m.name, t.complications

// Dentistas con más citas este mes
MATCH (d:User {role: 'DENTIST'})<-[:WITH_DENTIST]-(a:Appointment)
WHERE a.dateTime >= datetime() - duration({days: 30})
RETURN d.firstName, d.lastName, count(a) as total_citas
ORDER BY total_citas DESC

// Materiales con stock bajo
MATCH (m:Material)
WHERE m.stockQuantity < m.minStockLevel
RETURN m.name, m.stockQuantity, m.minStockLevel
ORDER BY m.stockQuantity
```

## 🧪 Testing

```powershell
npm test
```

## 🏗️ Producción

### Build

```powershell
npm run build
npm start
```

### Despliegue (Vercel)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en Vercel Dashboard
3. Conectar Neo4j AuraDB (cloud)
4. Deploy automático en cada push a `main`

### Despliegue Manual (VPS/Cloud)

```powershell
# Instalar PM2
npm install -g pm2

# Build
npm run build

# Iniciar con PM2
pm2 start npm --name "clinica-dental" -- start
pm2 save
pm2 startup
```

## 📊 Estructura de Carpetas

```
clinica-odon/
├── app/
│   ├── api/              # API Routes (Next.js)
│   │   ├── auth/         # Login, Register
│   │   ├── patients/     # CRUD Pacientes
│   │   ├── appointments/ # Citas
│   │   ├── treatments/   # Tratamientos
│   │   ├── voice/        # Agente IA
│   │   └── ...
│   ├── dashboard/        # Páginas protegidas
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── components/           # Componentes React
├── lib/
│   ├── neo4j.ts         # Cliente Neo4j
│   ├── auth.ts          # JWT helpers
│   └── notifications.ts # SMS/Email
├── types/
│   └── index.ts         # TypeScript types
├── scripts/
│   ├── init-neo4j.js    # Inicializar DB
│   └── reset-supabase.* # (legacy, ignorar)
├── .env.example
├── package.json
├── tailwind.config.ts
└── README.md
```

## 🔒 Cumplimiento Normativo

- **HIPAA**: Cifrado de datos en tránsito (HTTPS) y reposo
- **GDPR**: Derecho al olvido, exportación de datos, consentimiento
- **Auditoría**: Logs de acceso a historiales clínicos
- **Backup**: Recomendado backup diario de Neo4j

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir funcionalidad X'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo `LICENSE`

## 📞 Soporte

- Email: soporte@clinica-dental-saas.com
- Documentación: [docs.clinica-dental-saas.com](https://docs.clinica-dental-saas.com)
- Issues: GitHub Issues

## 🎯 Roadmap

- [ ] App móvil nativa (React Native)
- [ ] Integración con laboratorios dentales
- [ ] Telemetría de equipos (rayos X, etc.)
- [ ] IA predictiva para diagnósticos
- [ ] Soporte multi-clínica (franquicias)
- [ ] Integración HL7/FHIR

---

**Desarrollado con ❤️ para mejorar la gestión de clínicas dentales**
