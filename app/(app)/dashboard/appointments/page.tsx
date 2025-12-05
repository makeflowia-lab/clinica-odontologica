"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Download,
  Edit2,
  Trash2,
} from "lucide-react";
import { exportAppointmentsToExcel } from "@/lib/excel-export";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  patientName: string;
  dentistName?: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed";
  notes?: string;
}

// Definí las interfaces para los tipos de datos
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

const AppointmentsPage = () => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });

  const showAlert = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message, type: "alert" });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setModalState({ isOpen: true, title, message, type: "confirm", onConfirm });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Helper to get local date string in YYYY-MM-DD format
  const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [filter, setFilter] = useState<
    "all" | "scheduled" | "confirmed" | "cancelled" | "completed"
  >("all");
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [formData, setFormData] = useState({
    patientId: "",
    dentistId: "",
    patientEmail: "",
    patientPhone: "",
    date: getLocalDateString(),
    time: "09:00",
    duration: 60,
    reason: "",
    notes: "",
  });
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointments();
    loadPatients();
    loadDoctors();
  }, [selectedDate, filter]);

  const loadAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      // Only add date filter if it's not empty
      if (selectedDate) {
        // Create date object from selected date string (YYYY-MM-DD) treated as local
        const [year, month, day] = selectedDate.split("-").map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        params.append("startDate", startOfDay.toISOString());
        params.append("endDate", endOfDay.toISOString());
      }
      if (filter !== "all") params.append("status", filter.toUpperCase());
      const response = await fetch(`/api/appointments?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const mappedAppointments = (data.appointments || []).map((apt: any) => {
          const dateObj = new Date(apt.dateTime);
          return {
            ...apt,
            status: apt.status ? apt.status.toLowerCase() : "scheduled", // Convert to lowercase for frontend
            date: dateObj.toLocaleDateString("en-CA"), // YYYY-MM-DD in local time
            time: dateObj.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            patientName: apt.patient
              ? `${apt.patient.firstName} ${apt.patient.lastName}`
              : "Paciente Desconocido",
            patientPhone: apt.patient?.phone || "",
            patientEmail: apt.patient?.email || "",
            dentistName: apt.dentist
              ? `${apt.dentist.firstName} ${apt.dentist.lastName}`
              : "Dentista Desconocido",
          };
        });
        setAppointments(mappedAppointments);
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    }
  };

  const loadPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        setPatients([]);
      }
    } catch {
      setPatients([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/dentists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Map dentists to the format we need (add specialty if needed)
        const mappedDoctors = (data.dentists || []).map((d: any) => ({
          id: d.id,
          firstName: d.firstName,
          lastName: d.lastName,
          specialty: "Odontología", // Default since API doesn't return specialty
        }));
        setDoctors(mappedDoctors);
      } else {
        setDoctors([]);
      }
    } catch {
      setDoctors([]);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const dateMatch = apt.date === selectedDate;
    const statusMatch = filter === "all" || apt.status === filter;
    return dateMatch && statusMatch;
  });

  const handleCreateAppointment = async () => {
    if (
      !formData.patientId ||
      !formData.dentistId ||
      !formData.patientPhone ||
      !formData.reason
    ) {
      showAlert("Error", "Por favor complete todos los campos requeridos");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      // Create date object from local input and convert to ISO
      const localDateTime = new Date(`${formData.date}T${formData.time}`);

      const body = {
        patientId: formData.patientId,
        dentistId: formData.dentistId,
        dateTime: localDateTime.toISOString(),
        duration: formData.duration,
        type: "CONSULTATION", // O permitir seleccionar tipo
        notes: formData.notes,
      };
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        await loadAppointments();
        setShowNewModal(false);
        resetForm();
        showAlert("Éxito", "Cita creada exitosamente");
      } else {
        const error = await response.json();

        // Si hay conflicto y hay horarios sugeridos
        if (
          error.conflict &&
          error.suggestedTimes &&
          error.suggestedTimes.length > 0
        ) {
          const suggestions = error.suggestedTimes
            .map((st: any) => {
              const dt = new Date(st.dateTime);
              const time = dt.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return `${st.label}: ${time}`;
            })
            .join("\n");

          showConfirm(
            "Conflicto de Horario",
            `${error.error}\n\n${error.message}\n\nHorarios sugeridos:\n${suggestions}\n\n¿Desea usar uno de estos horarios?`,
            () => {
              if (error.suggestedTimes.length > 0) {
                // Usar el primer horario sugerido
                const suggestedDateTime = new Date(
                  error.suggestedTimes[0].dateTime
                );
                const suggestedDate = suggestedDateTime
                  .toISOString()
                  .split("T")[0];
                const suggestedTime = suggestedDateTime
                  .toTimeString()
                  .slice(0, 5);

                setFormData({
                  ...formData,
                  date: suggestedDate,
                  time: suggestedTime,
                });

                showAlert(
                  "Horario Actualizado",
                  `Horario actualizado a: ${error.suggestedTimes[0].label}`
                );
              }
            }
          );
        } else {
          showAlert(
            "Error",
            error.message || error.error || "Error al crear cita"
          );
        }
      }
    } catch {
      showAlert("Error", "Error al crear cita");
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patientId || "",
      dentistId: appointment.dentistId || "",
      patientEmail: appointment.patientEmail,
      patientPhone: appointment.patientPhone,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      reason: appointment.reason,
      notes: appointment.notes || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateAppointment = () => {
    if (editingAppointment) {
      const token = localStorage.getItem("token");
      fetch(`/api/appointments?id=${editingAppointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          dateTime: new Date(`${formData.date}T${formData.time}`).toISOString(),
        }),
      })
        .then((res) => (res.ok ? loadAppointments() : Promise.reject(res)))
        .then(() => {
          setShowEditModal(false);
          setEditingAppointment(null);
          resetForm();
        })
        .catch(async (err) => {
          let msg = "Error al actualizar cita";
          try {
            msg = (await err.json()).error || msg;
          } catch {}
          showAlert("Error", msg);
        });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      });

      if (response.ok) {
        await loadAppointments();
      } else {
        const error = await response.json();
        showAlert(
          "Error",
          error.error || "Error al actualizar el estado de la cita"
        );
      }
    } catch {
      showAlert("Error", "Error al actualizar el estado de la cita");
    }
  };

  const handleCancelAppointment = (id: string) => {
    showConfirm("Cancelar Cita", "¿Está seguro de cancelar esta cita?", () => {
      const token = localStorage.getItem("token");
      fetch(`/api/appointments?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
        .then((res) => (res.ok ? loadAppointments() : Promise.reject(res)))
        .catch(async (err) => {
          let msg = "Error al cancelar cita";
          try {
            msg = (await err.json()).error || msg;
          } catch {}
          showAlert("Error", msg);
        });
    });
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      dentistId: "",
      patientEmail: "",
      patientPhone: "",
      date: getLocalDateString(),
      time: "09:00",
      duration: 60,
      reason: "",
      notes: "",
    });
  };

  const handleExport = () => {
    exportAppointmentsToExcel(appointments);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda de Citas</h1>
          <p className="text-gray-600 mt-1">Gestiona las citas de la clínica</p>
        </div>
        <div className="flex space-x-3">
          <button
            title="Exportar citas a Excel"
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            title="Crear nueva cita"
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              title="Seleccionar fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              title="Filtrar por estado"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="scheduled">Programadas</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAppointments.length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-green-600">
                {
                  filteredAppointments.filter((a) => a.status === "confirmed")
                    .length
                }
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Programadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {
                  filteredAppointments.filter((a) => a.status === "scheduled")
                    .length
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-600">
                {
                  filteredAppointments.filter((a) => a.status === "completed")
                    .length
                }
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay citas para esta fecha</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {appointment.patientName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {appointment.time} ({appointment.duration} min)
                            </span>
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {appointment.patientPhone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-13">
                        <p className="text-gray-700 mb-2">
                          <strong>Motivo:</strong> {appointment.reason}
                        </p>
                        {appointment.notes && (
                          <p className="text-sm text-gray-600">
                            <strong>Notas:</strong> {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-medium text-gray-600">
                          Estado:
                        </label>
                        <select
                          title="Cambiar estado de la cita"
                          value={appointment.status}
                          onChange={(e) =>
                            handleStatusChange(appointment.id, e.target.value)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          <option value="scheduled">Programada</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="completed">Completada</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </div>

                      <button
                        title="Editar cita"
                        onClick={() => handleEditAppointment(appointment)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        title="Eliminar cita"
                        onClick={() => {
                          showConfirm(
                            "Eliminar Cita",
                            "¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.",
                            async () => {
                              try {
                                const token = localStorage.getItem("token");
                                const response = await fetch(
                                  `/api/appointments?id=${appointment.id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );

                                if (response.ok) {
                                  loadAppointments();
                                } else {
                                  showAlert(
                                    "Error",
                                    "Error al eliminar la cita"
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error deleting appointment:",
                                  error
                                );
                                showAlert("Error", "Error al eliminar la cita");
                              }
                            }
                          );
                        }}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nueva Cita */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Nueva Cita</h2>
              <button
                title="Cerrar"
                onClick={() => {
                  setShowNewModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <select
                    value={formData.patientId}
                    onChange={(e) =>
                      setFormData({ ...formData, patientId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    title="Seleccionar paciente"
                  >
                    <option value="">Seleccionar paciente...</option>
                    {patients.length === 0
                      ? null
                      : patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dentista *
                  </label>
                  <select
                    value={formData.dentistId}
                    onChange={(e) =>
                      setFormData({ ...formData, dentistId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    title="Seleccionar dentista"
                  >
                    <option value="">Seleccionar dentista...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.firstName} {d.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    title="Teléfono del paciente"
                    value={formData.patientPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, patientPhone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  title="Email del paciente"
                  value={formData.patientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, patientEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    title="Fecha de la cita"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora *
                  </label>
                  <input
                    type="time"
                    title="Hora de la cita"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (min) *
                  </label>
                  <select
                    title="Duración de la cita en minutos"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1.5 horas</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la Cita *
                </label>
                <input
                  type="text"
                  title="Motivo de la cita"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Ej: Limpieza dental, Revisión, Tratamiento..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  title="Notas adicionales"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Información adicional sobre la cita..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  title="Cancelar"
                  onClick={() => {
                    setShowNewModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  title="Crear cita"
                  onClick={handleCreateAppointment}
                  disabled={
                    !formData.patientId ||
                    !formData.dentistId ||
                    !formData.patientPhone ||
                    !formData.reason
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Cita</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Cita */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Editar Cita</h2>
              <button
                title="Cerrar"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAppointment(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Paciente *
                  </label>
                  <input
                    type="text"
                    title="Nombre del paciente"
                    value={editingAppointment?.patientName || ""}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    title="Teléfono del paciente"
                    value={formData.patientPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, patientPhone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  title="Email del paciente"
                  value={formData.patientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, patientEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    title="Fecha de la cita"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora *
                  </label>
                  <input
                    type="time"
                    title="Hora de la cita"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (min) *
                  </label>
                  <select
                    title="Duración de la cita en minutos"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1.5 horas</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la Cita *
                </label>
                <input
                  type="text"
                  title="Motivo de la cita"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Ej: Limpieza dental, Revisión, Tratamiento..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  title="Notas adicionales"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Información adicional sobre la cita..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  title="Cancelar"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAppointment(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  title="Guardar cambios"
                  onClick={handleUpdateAppointment}
                  disabled={
                    !formData.patientId ||
                    !formData.dentistId ||
                    !formData.patientPhone ||
                    !formData.reason
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render ConfirmDialog */}
      <ConfirmDialog
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={() => {
          if (modalState.onConfirm) {
            modalState.onConfirm();
          }
          closeModal();
        }}
        onCancel={closeModal}
        confirmText="Aceptar"
        cancelText={modalState.type === "confirm" ? "Cancelar" : undefined}
        variant={modalState.type === "alert" ? "info" : "danger"}
      />
    </div>
  );
};

export default AppointmentsPage;
