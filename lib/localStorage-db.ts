// Sistema de almacenamiento local para desarrollo (simula base de datos)
// En producción esto debe ser reemplazado por Neo4j o MongoDB

export const LocalDB = {
  // Doctors
  getDoctors: (): any[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem("doctors");
    return data ? JSON.parse(data) : [];
  },

  saveDoctors: (doctors: any[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("doctors", JSON.stringify(doctors));
  },

  addDoctor: (doctor: any) => {
    const doctors = LocalDB.getDoctors();
    doctors.push({ ...doctor, id: Date.now().toString() });
    LocalDB.saveDoctors(doctors);
    return doctors[doctors.length - 1];
  },

  updateDoctor: (id: string, data: any) => {
    const doctors = LocalDB.getDoctors();
    const index = doctors.findIndex((d: any) => d.id === id);
    if (index !== -1) {
      doctors[index] = { ...doctors[index], ...data };
      LocalDB.saveDoctors(doctors);
      return doctors[index];
    }
    return null;
  },

  deleteDoctor: (id: string) => {
    const doctors = LocalDB.getDoctors();
    const filtered = doctors.filter((d: any) => d.id !== id);
    LocalDB.saveDoctors(filtered);
  },
  // Patients
  getPatients: (): any[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem("patients");
    return data ? JSON.parse(data) : [];
  },

  savePatients: (patients: any[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("patients", JSON.stringify(patients));
  },

  addPatient: (patient: any) => {
    const patients = LocalDB.getPatients();
    patients.push({ ...patient, id: Date.now().toString() });
    LocalDB.savePatients(patients);
    return patients[patients.length - 1];
  },

  updatePatient: (id: string, data: any) => {
    const patients = LocalDB.getPatients();
    const index = patients.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      patients[index] = { ...patients[index], ...data };
      LocalDB.savePatients(patients);
      return patients[index];
    }
    return null;
  },

  deletePatient: (id: string) => {
    const patients = LocalDB.getPatients();
    const filtered = patients.filter((p: any) => p.id !== id);
    LocalDB.savePatients(filtered);
  },
  // Appointments
  getAppointments: (): any[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem("appointments");
    return data ? JSON.parse(data) : [];
  },

  saveAppointments: (appointments: any[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("appointments", JSON.stringify(appointments));
  },

  addAppointment: (appointment: any) => {
    const appointments = LocalDB.getAppointments();
    appointments.push({ ...appointment, id: Date.now().toString() });
    LocalDB.saveAppointments(appointments);
    return appointments[appointments.length - 1];
  },

  updateAppointment: (id: string, data: any) => {
    const appointments = LocalDB.getAppointments();
    const index = appointments.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      appointments[index] = { ...appointments[index], ...data };
      LocalDB.saveAppointments(appointments);
      return appointments[index];
    }
    return null;
  },

  deleteAppointment: (id: string) => {
    const appointments = LocalDB.getAppointments();
    const filtered = appointments.filter((a: any) => a.id !== id);
    LocalDB.saveAppointments(filtered);
  },

  // Inventory
  getInventory: (): any[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem("inventory");
    return data ? JSON.parse(data) : [];
  },

  saveInventory: (items: any[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("inventory", JSON.stringify(items));
  },

  addInventoryItem: (item: any) => {
    const items = LocalDB.getInventory();
    items.push({ ...item, id: Date.now().toString() });
    LocalDB.saveInventory(items);
    return items[items.length - 1];
  },

  updateInventoryItem: (id: string, data: any) => {
    const items = LocalDB.getInventory();
    const index = items.findIndex((i: any) => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data };
      LocalDB.saveInventory(items);
      return items[index];
    }
    return null;
  },

  deleteInventoryItem: (id: string) => {
    const items = LocalDB.getInventory();
    const filtered = items.filter((i: any) => i.id !== id);
    LocalDB.saveInventory(filtered);
  },

  // Invoices
  getInvoices: (): any[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem("invoices_v2");
    return data ? JSON.parse(data) : [];
  },

  saveInvoices: (invoices: any[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("invoices_v2", JSON.stringify(invoices));
  },

  addInvoice: (invoice: any) => {
    const invoices = LocalDB.getInvoices();
    const newInvoice = {
      ...invoice,
      id: Date.now().toString(),
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(
        invoices.length + 1
      ).padStart(3, "0")}`,
    };
    invoices.push(newInvoice);
    LocalDB.saveInvoices(invoices);
    return newInvoice;
  },

  updateInvoice: (id: string, data: any) => {
    const invoices = LocalDB.getInvoices();
    const index = invoices.findIndex((i: any) => i.id === id);
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...data };
      LocalDB.saveInvoices(invoices);
      return invoices[index];
    }
    return null;
  },

  // Settings
  getSettings: (): any => {
    if (typeof window === "undefined") return {};
    const data = localStorage.getItem("settings");
    return data ? JSON.parse(data) : {};
  },

  saveSettings: (settings: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("settings", JSON.stringify(settings));
  },

  // Initialize with mock data if empty
  initializeMockData: () => {
    if (typeof window === "undefined") return;

    // Solo estructura, sin datos de prueba. No inicializar nada por defecto.
  },
};
