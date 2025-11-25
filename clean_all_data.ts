/**
 * SCRIPT DE LIMPIEZA TOTAL DE DATOS
 *
 * Este script elimina TODOS los datos de localStorage.
 * Ejecuta este archivo con: npx tsx clean_all_data.ts
 */

console.log("🧹 LIMPIANDO TODOS LOS DATOS...\n");

// Simular limpieza de localStorage (esto se debe hacer en el navegador)
console.log("⚠️  IMPORTANTE: Este script debe ejecutarse en el NAVEGADOR");
console.log("");
console.log("📋 INSTRUCCIONES:");
console.log("");
console.log("1. Abre la aplicación en el navegador: http://localhost:3000");
console.log("2. Presiona F12 para abrir DevTools");
console.log('3. Ve a la pestaña "Console"');
console.log("4. Copia y pega el siguiente código:\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`
// Limpiar TODOS los datos de localStorage
localStorage.clear();
console.log('✅ localStorage completamente limpio!');

// Verificar
console.log('📊 Datos restantes:', localStorage.length);

// Recargar página
location.reload();
`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");
console.log("5. Presiona ENTER");
console.log("6. La página se recargará automáticamente");
console.log("");
console.log("✨ ¡Listo! Todos los datos de prueba habrán sido eliminados.");
