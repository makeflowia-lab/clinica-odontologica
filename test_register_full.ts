async function testRegisterFull() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin_full@gmail.com",
        password: "password123",
        firstName: "Admin",
        lastName: "Full",
        role: "ADMIN",
        phone: "1234567890",
        recoverySecret: "admin123",
      }),
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

testRegisterFull();
