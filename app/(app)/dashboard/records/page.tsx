"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  User,
  Calendar,
  Clipboard,
  Plus,
  X,
  Upload,
  Camera,
  Eye,
  Trash2,
  Edit,
} from "lucide-react";

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  type: "consultation" | "treatment" | "surgery" | "followup";
  diagnosis: string;
  treatment: string;
  notes: string;
  dentist: string;
  odontogram?: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "consultation" | "treatment" | "surgery" | "followup"
  >("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
    null
  );
  const [showOdontogram, setShowOdontogram] = useState(false);
  const [odontogramImage, setOdontogramImage] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [formData, setFormData] = useState({
    patientId: "",
    dentistId: "",
    date: new Date().toISOString().split("T")[0],
    type: "consultation" as
      | "consultation"
      | "treatment"
      | "surgery"
      | "followup",
    diagnosis: "",
    treatment: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
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
          setDoctors(data.dentists || []);
        } else {
          setDoctors([]);
        }
      } catch {
        setDoctors([]);
      }
    };
    loadPatients();
    loadDoctors();
  }, []);

  const loadRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/records", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error("Error loading records:", error);
      setRecords([]);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = records.filter((record) => {
    const searchMatch =
      record.patientName.toLowerCase().includes(search.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(search.toLowerCase());
    const typeMatch = filterType === "all" || record.type === filterType;
    return searchMatch && typeMatch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "consultation":
        return "bg-blue-100 text-blue-800";
      case "treatment":
        return "bg-green-100 text-green-800";
      case "surgery":
        return "bg-red-100 text-red-800";
      case "followup":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "consultation":
        return "Consulta";
      case "treatment":
        return "Tratamiento";
      case "surgery":
        return "Cirugía";
      case "followup":
        return "Seguimiento";
      default:
        return type;
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const handleOdontogramUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOdontogramImage(reader.result as string);
        setShowOdontogram(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeOdontogram = async () => {
    setAnalyzing(true);
    setAnalysisResult(
      "🔄 Analizando odontograma con IA...\n\nEstamos procesando la imagen con GPT-4 Vision de OpenAI para proporcionarte un análisis dental profesional y preciso.\n\nEsto puede tomar unos segundos..."
    );

    try {
      const response = await fetch("/api/analyze-odontogram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: odontogramImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Error al analizar");
      }

      if (data.success && data.analysis) {
        setAnalysisResult(
          "✅ ANÁLISIS COMPLETADO\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            data.analysis +
            "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
            `📅 Análisis realizado: ${new Date(data.timestamp).toLocaleString(
              "es-ES"
            )}\n` +
            "🤖 Powered by OpenAI GPT-4 Vision"
        );
      } else {
        throw new Error("No se recibió análisis válido");
      }
    } catch (error: any) {
      console.error("Error al analizar odontograma:", error);
      setAnalysisResult(
        "❌ ERROR EN EL ANÁLISIS\n\n" +
          `Detalle: ${error.message}\n\n` +
          "⚙️ CONFIGURACIÓN NECESARIA:\n\n" +
          "1. Asegúrate de tener una API key de OpenAI válida\n" +
          "2. Agrega OPENAI_API_KEY en tu archivo .env\n" +
          "3. La API key debe tener acceso a GPT-4 Vision (gpt-4o)\n\n" +
          "📖 Obtén tu API key en: https://platform.openai.com/api-keys\n\n" +
          "Mientras tanto, puedes usar el modo de demostración con imágenes de ejemplo."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateRecord = async () => {
    if (
      !formData.patientId ||
      !formData.dentistId ||
      !formData.diagnosis ||
      !formData.treatment
    ) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = editingId ? "/api/records" : "/api/records";
      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        loadRecords();
        setShowNewModal(false);
        resetForm();
        alert(
          editingId
            ? "Historial clínico actualizado exitosamente"
            : "Historial clínico creado exitosamente"
        );
      } else {
        const errorData = await response.json();
        alert(
          errorData.error ||
            (editingId
              ? "Error al actualizar el historial clínico"
              : "Error al crear el historial clínico")
        );
      }
    } catch (error) {
      console.error("Error saving record:", error);
      alert(
        editingId
          ? "Error al actualizar el historial clínico"
          : "Error al crear el historial clínico"
      );
    }
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setEditingId(record.id);
    setFormData({
      patientId: record.patientId,
      dentistId: "", // API doesn't return dentistId, user will need to reselect
      date: new Date(record.date).toISOString().split("T")[0],
      type: record.type,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      notes: record.notes,
    });
    setShowNewModal(true);
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      dentistId: "",
      date: new Date().toISOString().split("T")[0],
      type: "consultation",
      diagnosis: "",
      treatment: "",
      notes: "",
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Historiales Clínicos
          </h1>
          <p className="text-gray-600 mt-1">
            Consulta y gestiona historiales médicos
          </p>
        </div>
        <button
          title="Crear nuevo registro médico"
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Registro</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por paciente o diagnóstico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              title="Filtrar por tipo de registro"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="consultation">Consultas</option>
              <option value="treatment">Tratamientos</option>
              <option value="surgery">Cirugías</option>
              <option value="followup">Seguimientos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900">
                {records.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Consultas</p>
              <p className="text-2xl font-bold text-blue-600">
                {records.filter((r) => r.type === "consultation").length}
              </p>
            </div>
            <Clipboard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tratamientos</p>
              <p className="text-2xl font-bold text-green-600">
                {records.filter((r) => r.type === "treatment").length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Este Mes</p>
              <p className="text-2xl font-bold text-gray-600">
                {
                  records.filter((r) => {
                    const recordDate = new Date(r.date);
                    const now = new Date();
                    return (
                      recordDate.getMonth() === now.getMonth() &&
                      recordDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
            <Calendar className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron historiales</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnóstico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tratamiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dentista
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {record.patientName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                          record.type
                        )}`}
                      >
                        {getTypeName(record.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.diagnosis}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.treatment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.dentist}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        title="Ver registro completo"
                        onClick={() => handleViewRecord(record)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </button>
                      <button
                        title="Editar registro"
                        onClick={() => handleEditRecord(record)}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        title="Eliminar registro"
                        onClick={async () => {
                          if (
                            confirm(
                              "¿Estás seguro de que deseas eliminar este historial clínico? Esta acción no se puede deshacer."
                            )
                          ) {
                            try {
                              const token = localStorage.getItem("token");
                              const response = await fetch(
                                `/api/records?id=${record.id}`,
                                {
                                  method: "DELETE",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );

                              if (response.ok) {
                                loadRecords();
                              } else {
                                const data = await response.json();
                                alert(
                                  data.error ||
                                    "Error al eliminar el historial clínico"
                                );
                              }
                            } catch (error) {
                              console.error("Error deleting record:", error);
                              alert("Error al eliminar el historial clínico");
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-900 ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalle de Registro */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalle del Historial Clínico
              </h2>
              <button
                title="Cerrar"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRecord(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Paciente
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedRecord.patientName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Fecha
                  </label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedRecord.date).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tipo de Registro
                </label>
                <p className="mt-1">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(
                      selectedRecord.type
                    )}`}
                  >
                    {getTypeName(selectedRecord.type)}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Diagnóstico
                </label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedRecord.diagnosis}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tratamiento Aplicado
                </label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedRecord.treatment}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Notas Adicionales
                </label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedRecord.notes}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Dentista
                </label>
                <p className="mt-1 text-gray-900">{selectedRecord.dentist}</p>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  title="Cerrar modal"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Registro */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId
                  ? "Editar Historial Clínico"
                  : "Nuevo Historial Clínico"}
              </h2>
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
                    {patients.length === 0 ? (
                      <option value="">No hay pacientes registrados</option>
                    ) : (
                      patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    title="Fecha del registro"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Registro *
                </label>
                <select
                  title="Tipo de registro médico"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Consulta</option>
                  <option value="treatment">Tratamiento</option>
                  <option value="surgery">Cirugía</option>
                  <option value="followup">Seguimiento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnóstico *
                </label>
                <textarea
                  title="Diagnóstico del paciente"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tratamiento *
                </label>
                <textarea
                  title="Tratamiento aplicado"
                  value={formData.treatment}
                  onChange={(e) =>
                    setFormData({ ...formData, treatment: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  title="Notas y observaciones"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
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
                      {d.firstName} {d.lastName} ({d.specialty})
                    </option>
                  ))}
                </select>
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
                  title="Crear historial clínico"
                  onClick={handleCreateRecord}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingId ? "Actualizar" : "Crear Registro"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
