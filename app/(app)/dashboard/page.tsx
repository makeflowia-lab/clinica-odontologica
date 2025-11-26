"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Clock,
  Minus,
  X,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  todayAppointments: number;
  totalPatients: number;
  monthlyRevenue: number;
  pendingPayments: number;
}

interface Appointment {
  id: string;
  time: string;
  patient: string;
  type: string;
  dentist: string;
  status: "scheduled" | "confirmed" | "in_progress";
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todayAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  // Used Inventory Modal State
  const [showUsedModal, setShowUsedModal] = useState(false);
  const [usedItemId, setUsedItemId] = useState<string>("");
  const [usedQuantity, setUsedQuantity] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats({
            todayAppointments: data.stats.todayAppointments,
            totalPatients: data.stats.totalPatients,
            monthlyRevenue: data.stats.monthlyRevenue,
            pendingPayments: data.stats.pendingPayments,
          });

          // Map upcoming appointments to UI format
          const mappedAppointments = data.stats.upcomingAppointments.map(
            (apt: any) => ({
              id: apt.id,
              time: new Date(apt.dateTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              patient: apt.patient,
              type: apt.type,
              dentist: "", // API might not return dentist name yet
              status: apt.status.toLowerCase(),
            })
          );
          setAppointments(mappedAppointments);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const items = data.materials.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.stockQuantity,
          unit: item.unit,
          minStock: item.minStockLevel,
        }));
        setInventoryItems(items);
        setLowStockItems(
          items.filter((item: InventoryItem) => item.quantity <= item.minStock)
        );
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };

  const handleDeductStock = async () => {
    if (!usedItemId || usedQuantity <= 0) {
      alert("Seleccione un producto y una cantidad válida");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory/used", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: usedItemId, quantity: usedQuantity }),
      });
      if (response.ok) {
        await loadInventoryItems(); // Reload to update stock and alerts
        setShowUsedModal(false);
        setUsedItemId("");
        setUsedQuantity(1);
        alert("Stock actualizado correctamente");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Error al actualizar el stock");
      }
    } catch (error) {
      console.error("Error deducting stock:", error);
      alert("Error al actualizar el stock");
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

  // Filter items for the modal based on category
  const filteredItems =
    selectedCategory === "all"
      ? inventoryItems
      : inventoryItems.filter((item) => item.category === selectedCategory);

  // Get unique categories
  const categories = Array.from(
    new Set(inventoryItems.map((item) => item.category))
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Resumen de actividad y métricas clave
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/appointments" className="btn-secondary">
            <Clock className="w-4 h-4 mr-2 inline" />
            Ver Agenda
          </Link>
          <Link href="/dashboard/patients/new" className="btn-primary">
            <Plus className="w-4 h-4 mr-2 inline" />
            Nueva Mascota
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          title="Citas Hoy"
          value={stats.todayAppointments.toString()}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Pacientes Totales"
          value={stats.totalPatients.toString()}
          color="green"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Ingresos del Mes"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Pagos Pendientes"
          value={`$${stats.pendingPayments.toLocaleString()}`}
          color="orange"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Citas de Hoy
            </h2>
            <Link
              href="/dashboard/appointments"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay citas programadas para hoy.
              </p>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-semibold text-primary-600 w-16">
                      {apt.time}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{apt.patient}</p>
                      <p className="text-sm text-gray-600">
                        {getAppointmentTypeLabel(apt.type)} • {apt.dentist}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        apt.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : apt.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {apt.status === "confirmed"
                        ? "Confirmada"
                        : apt.status === "in_progress"
                        ? "En curso"
                        : "Programada"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Used Inventory Entry Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Ingreso de Inventario Usado
              </h3>
            </div>

            <button
              onClick={() => setShowUsedModal(true)}
              className="w-full py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 flex items-center justify-center mb-6 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Uso
            </button>

            <div>
              <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Stock Bajo
              </h4>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay alertas de stock bajo.
                </p>
              ) : (
                <div className="space-y-2">
                  {lowStockItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">{item.name}</span>
                      <span className="text-red-600 font-medium">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                  {lowStockItems.length > 5 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{lowStockItems.length - 5} más...
                    </p>
                  )}
                </div>
              )}

              <Link
                href="/dashboard/inventory"
                className="block mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Gestionar Inventario Completo →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Used Inventory Modal */}
      {showUsedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Registrar Uso de Material
              </h2>
              <button
                onClick={() => {
                  setShowUsedModal(false);
                  setUsedItemId("");
                  setUsedQuantity(1);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                </label>
                <select
                  value={usedItemId}
                  onChange={(e) => setUsedItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar material</option>
                  {filteredItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Usada
                </label>
                <input
                  type="number"
                  value={usedQuantity}
                  onChange={(e) => setUsedQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowUsedModal(false);
                    setUsedItemId("");
                    setUsedQuantity(1);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeductStock}
                  disabled={!usedItemId || usedQuantity <= 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  change,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
  };

  return (
    <div className={`card ${colors[color]} border-l-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && <p className="text-xs text-gray-500 mt-1">{change}</p>}
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
}
