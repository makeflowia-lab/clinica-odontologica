"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  FileText,
  CreditCard,
  ArrowLeft,
  Edit,
  Trash2,
} from "lucide-react";
import ImageOdontogram from "@/components/odontogram/ImageOdontogram";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  allergies: string[];
  medicalConditions: string[];
  medications: string[];
  notes: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "general" | "odontogram" | "records" | "billing"
  >("general");
  const [odontogramData, setOdontogramData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "info" | "danger" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    onConfirm: () => {},
  });

  const showAlert = (
    title: string,
    message: string,
    variant: "info" | "danger" | "warning" = "info"
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      variant,
      onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
    });
  };

  useEffect(() => {
    if (id) {
      loadPatient();
      loadOdontogram();
      loadAppointments();
      loadRecords();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/patients?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPatient(data.patient);
      } else {
        console.error("Error loading patient");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOdontogram = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/odontogram?patientId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.odontogram) {
          setOdontogramData(data.odontogram.data);
        }
      }
    } catch (error) {
      console.error("Error loading odontogram:", error);
    }
  };

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/appointments?patientId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    }
  };

  const loadRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/clinical-records?patientId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    }
  };

  const handleSaveOdontogram = async (data: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/odontogram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: id,
          data: data,
        }),
      });

      if (res.ok) {
        showAlert("Éxito", "Odontograma guardado exitosamente", "info");
        loadOdontogram();
      } else {
        showAlert("Error", "Error al guardar odontograma", "danger");
      }
    } catch (error) {
      console.error("Error saving odontogram:", error);
      showAlert("Error", "Error de conexión", "danger");
    }
  };

  const getAppointmentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      CONSULTATION: "Consulta",
      CLEANING: "Limpieza",
      FILLING: "Empaste",
      ROOT_CANAL: "Endodoncia",
      EXTRACTION: "Extracción",
      IMPLANT: "Implante",
      ORTHODONTICS: "Ortodoncia",
      EMERGENCY: "Emergencia",
      OTHER: "Otro",
    };
    return types[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statuses: { [key: string]: string } = {
      SCHEDULED: "Programada",
      CONFIRMED: "Confirmada",
      IN_PROGRESS: "En Progreso",
      COMPLETED: "Completada",
      CANCELLED: "Cancelada",
      NO_SHOW: "No Asistió",
    };
    return statuses[status.toUpperCase()] || status;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        Cargando información del paciente...
      </div>
    );
  }

  if (!patient) {
    return <div className="p-8 text-center">Paciente no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
        confirmText="Aceptar"
        variant={confirmDialog.variant}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600 text-sm">
              Expediente: {patient.id.substring(0, 8)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto pb-1">
        <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab("general")}
            className={`${
              activeTab === "general"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <User className="w-4 h-4" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab("odontogram")}
            className={`${
              activeTab === "odontogram"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Activity className="w-4 h-4" />
            <span>Odontograma</span>
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`${
              activeTab === "records"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <FileText className="w-4 h-4" />
            <span>Historial Clínico</span>
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`${
              activeTab === "billing"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pagos y Facturas</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <div className="flex items-center mt-1">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{patient.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Teléfono
                  </label>
                  <div className="flex items-center mt-1">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{patient.phone}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Fecha de Nacimiento
                  </label>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Dirección
                  </label>
                  <div className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">
                      {patient.address}, {patient.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Contacto de Emergencia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Nombre:</span>
                    <span className="ml-2 text-gray-900">
                      {patient.emergencyContact}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Teléfono:</span>
                    <span className="ml-2 text-gray-900">
                      {patient.emergencyPhone}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información Médica
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Tipo de Sangre
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {patient.bloodType || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Alergias
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patient.allergies && patient.allergies.length > 0 ? (
                      patient.allergies.map((allergy, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium"
                        >
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">
                        Ninguna registrada
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Condiciones Médicas
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patient.medicalConditions &&
                    patient.medicalConditions.length > 0 ? (
                      patient.medicalConditions.map((cond, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium"
                        >
                          {cond}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">
                        Ninguna registrada
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Medicamentos Actuales
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patient.medications && patient.medications.length > 0 ? (
                      patient.medications.map((med, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {med}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">
                        Ninguno registrado
                      </span>
                    )}
                  </div>
                </div>
                {patient.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Notas Adicionales
                    </label>
                    <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">
                      {patient.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "odontogram" && (
          <div>
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
              <h3 className="font-semibold text-blue-900">
                Odontograma Interactivo
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Selecciona una herramienta y haz clic en los dientes o sus
                superficies para marcar su estado. No olvides guardar los
                cambios.
              </p>
            </div>
            <ImageOdontogram
              initialData={odontogramData}
              onSave={handleSaveOdontogram}
              readOnly={false}
            />
          </div>
        )}

        {activeTab === "records" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-500" />
              Historial Clínico y Citas
            </h3>
            <div className="mb-6">
              <h4 className="text-md font-bold text-gray-800 mb-2">Citas</h4>
              {appointments.length === 0 ? (
                <p className="text-gray-500">
                  No hay citas registradas para este paciente.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {appointments.map((apt) => (
                    <li
                      key={apt.id}
                      className="py-2 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-semibold text-gray-900">
                          {new Date(apt.dateTime).toLocaleDateString()}{" "}
                          {new Date(apt.dateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="ml-2 text-gray-600">
                          {getAppointmentTypeLabel(apt.type)}
                        </span>
                        <span className="ml-2 text-gray-500">
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">{apt.notes}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-md font-bold text-gray-800 mb-2">
                Tratamientos y Consultas
              </h4>
              {records.length === 0 ? (
                <p className="text-gray-500">
                  No hay registros clínicos para este paciente.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {records.map((rec) => (
                    <li key={rec.id} className="py-2">
                      <div className="flex justify-between">
                        <div>
                          <span className="font-semibold text-gray-900">
                            {rec.date}
                          </span>
                          <span className="ml-2 text-gray-600">{rec.type}</span>
                          <span className="ml-2 text-gray-500">
                            {rec.diagnosis}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {rec.dentist}
                        </span>
                      </div>
                      <div className="text-gray-700 mt-1">{rec.treatment}</div>
                      {rec.notes && (
                        <div className="text-gray-500 mt-1">{rec.notes}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Facturas y pagos de este paciente próximamente.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Por ahora puedes ver todas las facturas en la sección principal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
