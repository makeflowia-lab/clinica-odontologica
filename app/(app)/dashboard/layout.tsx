"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Package,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Mic,
  ChevronDown,
  User,
  Bell,
} from "lucide-react";
import DigitalAssistant from "@/components/DigitalAssistant";
import { SidebarSubscription } from "@/components/SidebarSubscription";

import { SettingsProvider, useSettings } from "@/app/context/SettingsContext";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userApiKey, setUserApiKey] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    // Verificar si hay API key guardada en DB
    const checkApiKey = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          const response = await fetch(
            `/api/settings/api-key?userId=${user.id}`
          );
          const data = await response.json();
          if (data.hasKey) {
            setApiKeyConfigured(true);
          }
        }
      } catch (error) {
        console.error("Error checking API key:", error);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      console.warn(
        "Usuario no encontrado en localStorage, pero no se redirige a login."
      );
    }
  }, []);

  // Logout and redirect to login
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Pacientes", href: "/dashboard/patients" },
    { icon: Calendar, label: "Agenda", href: "/dashboard/appointments" },
    { icon: FileText, label: "Historiales", href: "/dashboard/records" },
    { icon: Package, label: "Inventario", href: "/dashboard/inventory" },
    { icon: DollarSign, label: "Facturación", href: "/dashboard/billing" },
    { icon: Users, label: "Usuarios", href: "/dashboard/users" },
    { icon: Settings, label: "Configuración", href: "/dashboard/settings" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-gray-200 w-64 lg:translate-x-0 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            {settings.clinic.logo ? (
              <img
                src={settings.clinic.logo}
                alt="Logo"
                className="h-8 w-8 object-contain flex-shrink-0"
              />
            ) : (
              <span className="text-2xl flex-shrink-0">🦷</span>
            )}
            <span className="font-bold text-gray-900 truncate text-sm sm:text-base">
              {settings.clinic.name || "Clínica Dental"}
            </span>
          </div>
          <button
            title="Cerrar menú"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile when clicking a menu item
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <SidebarSubscription />

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            title="Cerrar sesión"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <button
            title="Abrir/cerrar menú"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4">
            {/* Notifications removed as requested */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>

      {/* Digital Assistant Chat Widget */}
      <DigitalAssistant />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SettingsProvider>
  );
}
