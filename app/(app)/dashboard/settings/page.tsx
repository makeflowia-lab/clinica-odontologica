"use client";

import { useState, useEffect } from "react";
import {
  User,
  Building2,
  Bell,
  Lock,
  Globe,
  Brain,
  Save,
  Check,
  CreditCard,
} from "lucide-react";
import { useSettings } from "@/app/context/SettingsContext";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { settings, updateSettings, refreshSettings } = useSettings();
  const [saved, setSaved] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
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
            setApiKeySaved(true);
          }
        }
      } catch (error) {
        console.error("Error checking API key:", error);
      }
    };
    checkApiKey();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        await refreshSettings(); // Refresh context to update sidebar
        setTimeout(() => setSaved(false), 3000);
      } else {
        showAlert("Error", "Error al guardar la configuración", "danger");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showAlert("Error", "Error al guardar la configuración", "danger");
    }
  };

  const handlePasswordChange = () => {
    if (!settings.security.currentPassword || !settings.security.newPassword) {
      showAlert(
        "Error",
        "Por favor complete todos los campos de contraseña",
        "warning"
      );
      return;
    }
    if (settings.security.newPassword !== settings.security.confirmPassword) {
      showAlert("Error", "Las contraseñas no coinciden", "warning");
      return;
    }
    if (settings.security.newPassword.length < 8) {
      showAlert(
        "Error",
        "La contraseña debe tener al menos 8 caracteres",
        "warning"
      );
      return;
    }

    // En producción, aquí se haría la validación con el backend
    showAlert("Éxito", "Contraseña actualizada exitosamente", "info");
    updateSettings({
      ...settings,
      security: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    });
    handleSave();
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "clinic", label: "Clínica", icon: Building2 },
    { id: "billing", label: "Facturación", icon: CreditCard },
    { id: "security", label: "Seguridad", icon: Lock },
    { id: "ai", label: "AI", icon: Brain },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Administra las preferencias de tu cuenta y clínica
          </p>
        </div>
        <button
          title="Guardar todos los cambios"
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
            saved
              ? "bg-green-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? "Guardado" : "Guardar Cambios"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  title={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Información del Perfil
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      title="Nombre completo del doctor"
                      value={settings?.profile?.name || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            name: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad
                    </label>
                    <input
                      type="text"
                      title="Especialidad médica"
                      value={settings?.profile?.specialty || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            specialty: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      title="Correo electrónico"
                      value={settings?.profile?.email || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            email: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      title="Teléfono de contacto"
                      value={settings?.profile?.phone || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            phone: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Clinic Tab */}
            {activeTab === "clinic" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Información de la Clínica
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Clínica
                    </label>
                    <input
                      type="text"
                      title="Nombre de la clínica"
                      value={settings?.clinic?.name || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          clinic: { ...settings.clinic, name: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      title="Dirección de la clínica"
                      value={settings?.clinic?.address || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          clinic: {
                            ...settings.clinic,
                            address: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      title="Teléfono de la clínica"
                      value={settings?.clinic?.phone || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          clinic: { ...settings.clinic, phone: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      title="Correo electrónico de la clínica"
                      value={settings?.clinic?.email || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          clinic: { ...settings.clinic, email: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo de la Clínica
                    </label>
                    <div className="flex items-center space-x-4">
                      {settings?.clinic?.logo && (
                        <img
                          src={settings.clinic.logo}
                          alt="Logo"
                          className="h-12 w-12 rounded-full border"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        title="Subir logo de la clínica"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Customization Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Configuración de Factura
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Personaliza los datos adicionales para tus facturas.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo para Factura
                    </label>
                    <div className="flex items-center space-x-4">
                      {settings?.billing?.logo && (
                        <img
                          src={settings.billing.logo}
                          alt="Logo Factura"
                          className="h-12 w-12 rounded-full border"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        title="Subir logo para factura"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Clínica
                      </label>
                      <input
                        type="text"
                        title="Nombre de la clínica para la factura"
                        value={settings?.billing?.clinicName || ""}
                        onChange={(e) =>
                          updateSettings({
                            ...settings,
                            billing: {
                              ...settings.billing,
                              clinicName: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Veterinario
                      </label>
                      <input
                        type="text"
                        title="Nombre del veterinario para la factura"
                        value={settings?.billing?.dentistName || ""}
                        onChange={(e) =>
                          updateSettings({
                            ...settings,
                            billing: {
                              ...settings.billing,
                              dentistName: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número Telefónico
                    </label>
                    <input
                      type="tel"
                      title="Teléfono de contacto para la factura"
                      value={settings?.billing?.phone || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          billing: {
                            ...settings.billing,
                            phone: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      title="Email de contacto para la factura"
                      value={settings?.billing?.email || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          billing: {
                            ...settings.billing,
                            email: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Seguridad de la Cuenta
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      title="Contraseña actual"
                      value={settings?.security?.currentPassword || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            currentPassword: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      title="Nueva contraseña"
                      value={settings?.security?.newPassword || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            newPassword: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo 8 caracteres
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      title="Confirmar nueva contraseña"
                      value={settings?.security?.confirmPassword || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            confirmPassword: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    title="Cambiar contraseña"
                    onClick={handlePasswordChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Cambiar Contraseña</span>
                  </button>
                </div>
              </div>
            )}

            {/* AI Tab */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Configuración de Inteligencia Artificial
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key de Google AI
                    </label>
                    {apiKeySaved ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">
                            API Key guardada de forma segura
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const user = JSON.parse(
                                localStorage.getItem("user") || "{}"
                              );
                              await fetch("/api/settings/api-key", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: user.id }),
                              });
                              setApiKeySaved(false);
                              setTempApiKey("");
                            } catch (error) {
                              console.error("Error deleting API key", error);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Cambiar API Key
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <input
                            type="password"
                            title="API Key de Google AI"
                            placeholder="Pega tu API Key aquí"
                            value={tempApiKey}
                            onChange={(e) => setTempApiKey(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={async () => {
                              if (!tempApiKey) {
                                showAlert(
                                  "Error",
                                  "Por favor ingresa una API Key",
                                  "warning"
                                );
                                return;
                              }

                              try {
                                const user = JSON.parse(
                                  localStorage.getItem("user") || "{}"
                                );
                                const response = await fetch(
                                  "/api/settings/api-key",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      apiKey: tempApiKey,
                                      userId: user.id,
                                    }),
                                  }
                                );

                                if (response.ok) {
                                  setApiKeySaved(true);
                                  setTempApiKey("");
                                  setSaved(true);
                                  setTimeout(() => setSaved(false), 3000);
                                } else {
                                  throw new Error("Failed to save API key");
                                }
                              } catch (error) {
                                showAlert(
                                  "Error",
                                  "Error al guardar la API Key",
                                  "danger"
                                );
                              }
                            }}
                            disabled={!tempApiKey}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Guardar y Ocultar
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Esta clave se utiliza para las funcionalidades de
                      asistente digital y análisis de odontogramas.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-900">
                          ¿Cómo obtener tu API Key?
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          1. Visita{" "}
                          <a
                            href="https://makersuite.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-900"
                          >
                            Google AI Studio
                          </a>
                          <br />
                          2. Inicia sesión con tu cuenta de Google
                          <br />
                          3. Crea una nueva API Key
                          <br />
                          4. Copia y pega la clave aquí
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Preferencias Generales
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
                    <select
                      title="Seleccionar idioma"
                      value={settings?.language || "es"}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          language: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      title="Seleccionar zona horaria"
                      value={settings?.timezone || "America/Mexico_City"}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          timezone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="America/Mexico_City">
                        Ciudad de México (GMT-6)
                      </option>
                      <option value="America/New_York">
                        Nueva York (GMT-5)
                      </option>
                      <option value="America/Los_Angeles">
                        Los Ángeles (GMT-8)
                      </option>
                      <option value="America/Bogota">Bogotá (GMT-5)</option>
                      <option value="America/Buenos_Aires">
                        Buenos Aires (GMT-3)
                      </option>
                      <option value="Europe/Madrid">Madrid (GMT+1)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
