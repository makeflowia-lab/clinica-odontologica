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

import { Modal } from "@/app/components/ui/Modal";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { settings, updateSettings, refreshSettings } = useSettings();
  const [saved, setSaved] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
        setErrorMessage("Error al guardar la configuración");
        setErrorModalOpen(true);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorMessage("Error al guardar la configuración");
      setErrorModalOpen(true);
    }
  };

  const handlePasswordChange = () => {
    if (!settings.security.currentPassword || !settings.security.newPassword) {
      alert("Por favor complete todos los campos de contraseña");
      return;
    }
    if (settings.security.newPassword !== settings.security.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (settings.security.newPassword.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    // En producción, aquí se haría la validación con el backend
    alert("Contraseña actualizada exitosamente");
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
                      RFC / Tax ID / Otro
                    </label>
                    <input
                      type="text"
                      title="Identificación fiscal"
                      placeholder="Ej: SIVRHNECOLL2"
                      value={settings?.billing?.taxId || ""}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          billing: {
                            ...settings.billing,
                            taxId: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Opciones de Diseño
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color de la Factura
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="color"
                            title="Color principal de la factura"
                            value={settings?.invoiceColor || "#2563eb"}
                            onChange={(e) =>
                              updateSettings({
                                ...settings,
                                invoiceColor: e.target.value,
                              })
                            }
                            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                          />
                          <span className="text-sm text-gray-500">
                            Color principal del PDF
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pie de Página
                        </label>
                        <input
                          type="text"
                          title="Texto del pie de página"
                          placeholder="Ej: Gracias por su preferencia..."
                          value={settings?.invoiceFooter || ""}
                          onChange={(e) =>
                            updateSettings({
                              ...settings,
                              invoiceFooter: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Términos y Condiciones
                        </label>
                        <textarea
                          title="Términos y condiciones"
                          rows={3}
                          placeholder="Ej: Pago a 30 días..."
                          value={settings?.invoiceTerms || ""}
                          onChange={(e) =>
                            updateSettings({
                              ...settings,
                              invoiceTerms: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
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
                                setErrorMessage(
                                  "Por favor ingresa una API Key"
                                );
                                setErrorModalOpen(true);
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
                                setErrorMessage("Error al guardar la API Key");
                                setErrorModalOpen(true);
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

      <Modal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Mensaje del Sistema"
        footer={
          <button
            onClick={() => setErrorModalOpen(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aceptar
          </button>
        }
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
}
