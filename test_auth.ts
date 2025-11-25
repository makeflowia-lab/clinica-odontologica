// Script para probar el flujo de autenticación
// Ejecutar con: npx ts-node test_auth.ts

const BASE_URL = "http://localhost:3000";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "DENTIST" | "RECEPTIONIST";
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

async function testRegister(userData: RegisterData) {
  console.log("\n🔵 Probando registro de usuario...");
  console.log("Datos:", userData);

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Usuario registrado exitosamente:");
      console.log(JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log("❌ Error al registrar usuario:");
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error);
    return false;
  }
}

async function testLogin(credentials: LoginData) {
  console.log("\n🔵 Probando inicio de sesión...");
  console.log("Credenciales:", { email: credentials.email, password: "***" });

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Inicio de sesión exitoso:");
      console.log("Token:", data.token.substring(0, 20) + "...");
      console.log("Usuario:", JSON.stringify(data.user, null, 2));
      return data.token;
    } else {
      console.log("❌ Error al iniciar sesión:");
      console.log(JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error);
    return null;
  }
}

async function main() {
  console.log("🚀 Iniciando pruebas de autenticación...");
  console.log("Base URL:", BASE_URL);

  // Datos de prueba
  const testUser: RegisterData = {
    email: "admin@clinica.com",
    password: "admin123",
    firstName: "Admin",
    lastName: "Principal",
    role: "ADMIN",
    phone: "+52 123 456 7890",
  };

  // 1. Probar registro
  const registerSuccess = await testRegister(testUser);

  if (!registerSuccess) {
    console.log(
      "\n⚠️  El registro falló. Intentando login con credenciales existentes..."
    );
  }

  // 2. Probar login
  const token = await testLogin({
    email: testUser.email,
    password: testUser.password,
  });

  if (token) {
    console.log("\n✅ Todas las pruebas pasaron exitosamente!");
    console.log("\n📝 Credenciales para usar en el navegador:");
    console.log("Email:", testUser.email);
    console.log("Password:", testUser.password);
  } else {
    console.log("\n❌ Las pruebas fallaron");
  }
}

// Ejecutar pruebas
main().catch(console.error);
