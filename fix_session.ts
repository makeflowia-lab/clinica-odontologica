const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

const adminUser = {
  userId: '7788c83d-9964-4d3a-9dbe-40daf5109ea1',
  email: 'admin@clinica.com',
  role: 'ADMIN',
};

const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });

console.log('\n=== NUEVO TOKEN GENERADO ===\n');
console.log('Token:', token);
console.log('\n=== INSTRUCCIONES ===\n');
console.log('1. Abre el navegador en http://localhost:3000/dashboard');
console.log('2. Presiona F12 para abrir DevTools');
console.log('3. Ve a la pestaña "Console"');
console.log('4. Copia y pega este comando:\n');
console.log(`localStorage.setItem('token', '${token}');`);
console.log(`localStorage.setItem('user', '${JSON.stringify(JSON.stringify(adminUser))}');`);
console.log('location.reload();');
console.log('\n5. Presiona Enter');
console.log('6. La página se recargará con la sesión válida\n');
