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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    todayAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);

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
              }),
              patient: apt.patient,
              type: apt.type,
              dentist: "", // API might not return dentist name yet, or we need to update API
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
  }, []);

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
            Nuevo Paciente
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
            {appointments.map((apt) => (
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
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inventory Alerts */}
          <div className="card bg-blue-50 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              Alertas de Inventario
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              No hay alertas de inventario en este momento.
            </p>
            <Link
              href="/dashboard/inventory"
              className="block mt-4 text-center text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Gestionar Inventario →
            </Link>
          </div>
        </div>
      </div>
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
