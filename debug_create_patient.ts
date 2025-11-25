
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

const adminUser = {
  userId: '7788c83d-9964-4d3a-9dbe-40daf5109ea1', // ID from debug_db output
  email: 'admin@clinica.com',
  role: 'ADMIN',
};

const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '1h' });

async function createPatient() {
  console.log('Testing Patient Creation API...');
  console.log('Token:', token);

  const patientData = {
    firstName: 'Test',
    lastName: 'Patient',
    email: 'test.patient@example.com',
    phone: '555-0000',
    dateOfBirth: '1990-01-01',
    gender: 'M',
    address: '123 Test St',
    city: 'Test City',
  };

  try {
    const response = await axios.post('http://localhost:3000/api/patients', patientData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

createPatient();
