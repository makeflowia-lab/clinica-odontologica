// Base de datos temporal en memoria (solo para desarrollo sin Neo4j)
import { hashPassword } from "./auth";

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "DENTIST" | "RECEPTIONIST";
  clinicId?: string;
  createdAt: Date;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: "M" | "F" | "OTHER";
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  allergies?: string[];
  medicalConditions?: string[];
  medications?: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
  notes?: string;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  dateTime: string;
  duration: number;
  type: string;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: Date;
}

class MockDatabase {
  private users: Map<string, User> = new Map();
  private patients: Map<string, Patient> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Crear usuario admin por defecto
    const adminPassword = await hashPassword("admin123");
    const adminUser: User = {
      id: "1",
      email: "admin@clinica.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "Sistema",
      role: "ADMIN",
      createdAt: new Date(),
    };
    this.users.set(adminUser.email, adminUser);

    // Crear dentista de ejemplo
    const dentistaPassword = await hashPassword("dentista123");
    const dentistaUser: User = {
      id: "2",
      email: "dentista@clinica.com",
      password: dentistaPassword,
      firstName: "Dr. Juan",
      lastName: "Pérez",
      role: "DENTIST",
      createdAt: new Date(),
    };
    this.users.set(dentistaUser.email, dentistaUser);

    // Crear algunos pacientes de ejemplo
    const paciente1: Patient = {
      id: "p1",
      firstName: "María",
      lastName: "García",
      email: "maria@example.com",
      phone: "555-1234",
      dateOfBirth: "1985-03-15",
      gender: "F",
      allergies: ["Penicilina"],
      medicalConditions: [],
      medications: [],
      createdAt: new Date(),
    };
    this.patients.set(paciente1.id, paciente1);

    const paciente2: Patient = {
      id: "p2",
      firstName: "Carlos",
      lastName: "López",
      email: "carlos@example.com",
      phone: "555-5678",
      dateOfBirth: "1990-07-22",
      gender: "M",
      allergies: [],
      medicalConditions: ["Diabetes tipo 2"],
      medications: ["Metformina"],
      createdAt: new Date(),
    };
    this.patients.set(paciente2.id, paciente2);

    this.initialized = true;
    console.log("✅ Base de datos en memoria inicializada");
  }

  // Users
  async getUserByEmail(email: string): Promise<User | null> {
    await this.initialize();
    return this.users.get(email) || null;
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    await this.initialize();
    const newUser: User = {
      ...user,
      id: `u${this.users.size + 1}`,
      createdAt: new Date(),
    };
    this.users.set(newUser.email, newUser);
    return newUser;
  }

  // Patients
  async getPatients(search?: string): Promise<Patient[]> {
    await this.initialize();
    const allPatients = Array.from(this.patients.values());

    if (!search) return allPatients;

    const searchLower = search.toLowerCase();
    return allPatients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(searchLower) ||
        p.lastName.toLowerCase().includes(searchLower) ||
        p.phone.includes(search)
    );
  }

  async getPatientById(id: string): Promise<Patient | null> {
    await this.initialize();
    return this.patients.get(id) || null;
  }

  async createPatient(
    patient: Omit<Patient, "id" | "createdAt">
  ): Promise<Patient> {
    await this.initialize();
    const newPatient: Patient = {
      ...patient,
      id: `p${this.patients.size + 1}`,
      createdAt: new Date(),
    };
    this.patients.set(newPatient.id, newPatient);
    return newPatient;
  }

  async updatePatient(
    id: string,
    updates: Partial<Patient>
  ): Promise<Patient | null> {
    await this.initialize();
    const patient = this.patients.get(id);
    if (!patient) return null;

    const updated = { ...patient, ...updates };
    this.patients.set(id, updated);
    return updated;
  }

  async deletePatient(id: string): Promise<boolean> {
    await this.initialize();
    return this.patients.delete(id);
  }

  // Appointments
  async getAppointments(filters?: {
    patientId?: string;
    dentistId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> {
    await this.initialize();
    let appointments = Array.from(this.appointments.values());

    if (filters?.patientId) {
      appointments = appointments.filter(
        (a) => a.patientId === filters.patientId
      );
    }
    if (filters?.dentistId) {
      appointments = appointments.filter(
        (a) => a.dentistId === filters.dentistId
      );
    }
    if (filters?.startDate) {
      appointments = appointments.filter(
        (a) => a.dateTime >= filters.startDate!
      );
    }
    if (filters?.endDate) {
      appointments = appointments.filter((a) => a.dateTime <= filters.endDate!);
    }

    return appointments.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  }

  async createAppointment(
    appointment: Omit<Appointment, "id" | "createdAt">
  ): Promise<Appointment> {
    await this.initialize();
    const newAppointment: Appointment = {
      ...appointment,
      id: `a${this.appointments.size + 1}`,
      createdAt: new Date(),
    };
    this.appointments.set(newAppointment.id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(
    id: string,
    updates: Partial<Appointment>
  ): Promise<Appointment | null> {
    await this.initialize();
    const appointment = this.appointments.get(id);
    if (!appointment) return null;

    const updated = { ...appointment, ...updates };
    this.appointments.set(id, updated);
    return updated;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    await this.initialize();
    return this.appointments.delete(id);
  }
}

export const mockDB = new MockDatabase();
