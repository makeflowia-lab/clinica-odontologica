
import axios from 'axios';

async function debugPatientCreation() {
  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'admin@clinica.com',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('Login successful, token obtained.');

    // 2. Try to create patient with data similar to frontend
    const patientData = {
      firstName: "Debug",
      lastName: "Patient",
      email: "debug@test.com",
      phone: "1234567890",
      dateOfBirth: "1990-01-01",
      gender: "M", // Correct format
      address: "Test Address",
      city: "Test City",
      state: "Test State",
      zipCode: "12345",
      emergencyContact: "Emergency",
      emergencyPhone: "0987654321",
      bloodType: "O+",
      allergies: ["Peanuts"], // Correct format (array)
      currentMedications: [],
      medicalConditions: [],
      notes: "Debug notes"
    };

    console.log('Creating patient with data:', JSON.stringify(patientData, null, 2));

    const createRes = await axios.post(`${baseUrl}/api/patients`, {
      ...patientData
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response Status:', createRes.status);
    console.log('Response Body:', createRes.data);

    // 3. Try with empty email (common issue)
    const patientDataEmptyEmail = {
      ...patientData,
      firstName: "Debug2",
      email: ""
    };
    
    console.log('\nCreating patient with empty email...');
    const createRes2 = await axios.post(`${baseUrl}/api/patients`, {
      ...patientDataEmptyEmail
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response Status (Empty Email):', createRes2.status);
    console.log('Response Body (Empty Email):', createRes2.data);

  } catch (error: any) {
    console.error('Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

debugPatientCreation();
