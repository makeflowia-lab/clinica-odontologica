// Script para limpiar localStorage en el navegador
// Ejecutar en la consola del navegador (F12)

console.log("🧹 Limpiando datos de localStorage...");

// Limpiar facturas
localStorage.removeItem("invoices");
console.log("✅ Facturas eliminadas");

// Limpiar inventario
localStorage.removeItem("inventory");
console.log("✅ Inventario eliminado");

// Limpiar citas locales
localStorage.removeItem("appointments");
console.log("✅ Citas locales eliminadas");

// Limpiar pacientes locales
localStorage.removeItem("patients");
console.log("✅ Pacientes locales eliminados");

// Limpiar doctores locales
localStorage.removeItem("doctors");
console.log("✅ Doctores locales eliminados");

console.log("\n✨ localStorage limpio! Recarga la página (F5)");
