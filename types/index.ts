// Tipos de datos para el sistema

export interface User {
  id: string;
  email: string;
  password?: string; // Solo para creación/actualización
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DENTIST' | 'RECEPTIONIST';
  phone?: string;
  clinicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'M' | 'F' | 'OTHER';
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
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  dateTime: Date;
  duration: number; // en minutos
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  type: 'CONSULTATION' | 'CLEANING' | 'FILLING' | 'ROOT_CANAL' | 'EXTRACTION' | 'IMPLANT' | 'ORTHODONTICS' | 'OTHER';
  notes?: string;
  room?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Treatment {
  id: string;
  patientId: string;
  dentistId: string;
  appointmentId?: string;
  name: string;
  description?: string;
  tooth?: string; // Notación FDI (11-18, 21-28, 31-38, 41-48)
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate: Date;
  endDate?: Date;
  cost: number;
  paid: number;
  notes?: string;
  complications?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id: string;
  name: string;
  category: 'FILLING' | 'CROWN' | 'IMPLANT' | 'ORTHODONTIC' | 'CONSUMABLE' | 'EQUIPMENT' | 'OTHER';
  brand?: string;
  supplier?: string;
  unitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  patientId: string;
  appointmentId?: string;
  date: Date;
  dueDate: Date;
  total: number;
  paid: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: InvoiceItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  dentistId: string;
  date: Date;
  diagnosis?: string;
  treatmentPlan?: string;
  notes: string;
  attachments?: string[];
  odontogram?: OdontogramData;
  createdAt: Date;
  updatedAt: Date;
}

export interface OdontogramData {
  [tooth: string]: {
    status: 'HEALTHY' | 'CAVITY' | 'FILLED' | 'CROWN' | 'MISSING' | 'IMPLANT' | 'ROOT_CANAL';
    notes?: string;
    surfaces?: ('OCCLUSAL' | 'MESIAL' | 'DISTAL' | 'BUCCAL' | 'LINGUAL')[];
  };
}

export interface Notification {
  id: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  recipient: string;
  subject?: string;
  message: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  scheduledFor?: Date;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}
