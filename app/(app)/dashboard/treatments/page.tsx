"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Plus,
  Search,
  Filter,
  FileText,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Edit2,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Treatment {
  id: string;
  name: string;
  description?: string;
  tooth?: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate?: string;
  cost: number;
  paid: number;
  notes?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  dentist: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(
    null
  );

  const [formData, setFormData] = useState({
    patientId: "",
    dentistId: "",
    name: "",
    description: "",
    tooth: "",
    status: "PLANNED",
    startDate: new Date().toISOString().split("T")[0],
    cost: 0,
    notes: "",
  });

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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Load treatments
      const treatRes = await fetch("/api/treatments", { headers });
      if (treatRes.ok) {
        const data = await treatRes.json();
        setTreatments(data.treatments || []);
      }

      // Load patients for dropdown
      const patRes = await fetch("/api/patients?limit=100", { headers });
      if (patRes.ok) {
        const data = await patRes.json();
        setPatients(data.patients || []);
      }

      // Load doctors for dropdown
      const docRes = await fetch("/api/users/dentists", { headers });
      if (docRes.ok) {
        const data = await docRes.json();
        setDoctors(data.dentists || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        cost: Number(formData.cost),
        // Ensure dentistId is present (workaround: ask user or use dummy)
        // For now we require the user to input it or we could fetch the current user's ID if they are a dentist
      };

      const url = editingTreatment
        ? `/api/treatments?id=${editingTreatment.id}`
        : "/api/treatments";

      const method = editingTreatment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        loadData();
        setShowModal(false);
        resetForm();
        showAlert(
          "Éxito",
          editingTreatment ? "Tratamiento actualizado" : "Tratamiento creado",
          "info"
        );
      } else {
        const err = await res.json();
        showAlert(
          "Error",
          `Error: ${err.error || "Operación fallida"}`,
          "danger"
        );
      }
    } catch (error) {
      console.error(error);
      showAlert("Error", "Error al guardar tratamiento", "danger");
    }
  };

  const handleEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setFormData({
      patientId: treatment.patient.id,
      dentistId: treatment.dentist.id,
      name: treatment.name,
      description: treatment.description || "",
      tooth: treatment.tooth || "",
      status: treatment.status,
      startDate: treatment.startDate.split("T")[0],
      cost: treatment.cost,
      notes: treatment.notes || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingTreatment(null);
    setFormData({
      patientId: "",
      dentistId: "", // In a real app, pre-fill with current user if dentist
      name: "",
      description: "",
      tooth: "",
      status: "PLANNED",
      startDate: new Date().toISOString().split("T")[0],
      cost: 0,
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PLANNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    const labels = {
      PLANNED: "Planificado",
      IN_PROGRESS: "En Progreso",
      COMPLETED: "Completado",
      CANCELLED: "Cancelado",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || "bg-gray-100"
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const filteredTreatments = treatments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tratamientos</h1>
          <p className="text-gray-600 mt-1">Gestión de tratamientos dentales</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          title="Crear nuevo tratamiento"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Tratamiento</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por tratamiento o paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              title="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              <option value="PLANNED">Planificados</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Treatments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-500 mt-2">Cargando tratamientos...</p>
          </div>
        ) : filteredTreatments.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron tratamientos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tratamiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Inicio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTreatments.map((treatment) => (
                  <tr key={treatment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {treatment.name}
                      </div>
                      {treatment.tooth && (
                        <div className="text-xs text-gray-500">
                          Diente: {treatment.tooth}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-3">
                          {treatment.patient.firstName[0]}
                          {treatment.patient.lastName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {treatment.patient.firstName}{" "}
                            {treatment.patient.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(treatment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${treatment.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(treatment.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(treatment)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar tratamiento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTreatment ? "Editar Tratamiento" : "Nuevo Tratamiento"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
                title="Cerrar modal"
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
                    title="Seleccionar paciente"
                    required
                    disabled={!!editingTreatment}
                  >
                    <option value="">Seleccionar paciente...</option>
                    {patients.map((p) => (
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
                    title="Seleccionar dentista"
                    required
                  >
                    <option value="">Seleccionar dentista...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.firstName} {d.lastName} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Tratamiento *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  title="Nombre del tratamiento"
                  placeholder="Ej: Limpieza dental"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cost: Number(e.target.value),
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      title="Costo del tratamiento"
                      placeholder="Ej: 500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diente (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.tooth}
                    onChange={(e) =>
                      setFormData({ ...formData, tooth: e.target.value })
                    }
                    placeholder="Ej: 18, 24"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    title="Diente tratado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    title="Estado del tratamiento"
                  >
                    <option value="PLANNED">Planificado</option>
                    <option value="IN_PROGRESS">En Progreso</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  title="Descripción del tratamiento"
                  placeholder="Detalles del tratamiento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  title="Notas"
                  placeholder="Notas adicionales"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    !formData.patientId || !formData.name || !formData.dentistId
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTreatment ? "Guardar Cambios" : "Crear Tratamiento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
