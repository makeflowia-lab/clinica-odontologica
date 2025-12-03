"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: 39,
    period: "/mes",
    features: [
      "Hasta 100 pacientes",
      "1 Usuario",
      "50 Consultas IA/mes",
      "Soporte por Email",
    ],
  },
  {
    id: "PROFESSIONAL",
    name: "Profesional",
    price: 69,
    period: "/mes",
    recommended: true,
    features: [
      "Pacientes Ilimitados",
      "3 Usuarios",
      "200 Consultas IA/mes",
      "Soporte Prioritario",
      "Reportes Avanzados",
    ],
  },
  {
    id: "ANNUAL",
    name: "Anual",
    price: 580,
    period: "/año",
    features: [
      "Todo lo del Profesional",
      "IA Ilimitada",
      "2 Meses Gratis",
      "Capacitación Incluida",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 2500,
    period: " único",
    features: [
      "Instalación Dedicada",
      "Usuarios Ilimitados",
      "Personalización Total",
      "Soporte VIP",
    ],
  },
];

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription) {
          setCurrentPlan(data.subscription.planType);
        }
      });
  }, []);

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

  const handleUpgradeClick = (planId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirmar cambio de plan",
      message: `¿Estás seguro de cambiar al plan ${planId}?`,
      variant: "info",
      onConfirm: () => processUpgrade(planId),
    });
  };

  const processUpgrade = async (planId: string) => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showAlert("Error", data.error || "Error al iniciar el pago", "danger");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      showAlert("Error", "Error de conexión", "danger");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Planes y Suscripción
      </h1>
      <p className="text-gray-600 mb-8">
        Elige el plan que mejor se adapte a tu clínica.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-sm border p-6 transition-all hover:shadow-md ${
                  plan.recommended
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-gray-200"
                } ${currentPlan === plan.id ? "bg-blue-50" : ""}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    MÁS POPULAR
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-4xl font-extrabold tracking-tight">
                    ${plan.price}
                  </span>
                  <span className="ml-1 text-xl font-semibold text-gray-500">
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                      <span className="ml-3 text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgradeClick(plan.id)}
                  disabled={loading || currentPlan === plan.id}
                  className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    currentPlan === plan.id
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : plan.recommended
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : currentPlan === plan.id ? (
                    "Plan Actual"
                  ) : (
                    "Seleccionar Plan"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <SubscriptionStatus />

          <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              ¿Necesitas ayuda?
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Contacta a nuestro equipo de ventas para planes personalizados o
              dudas sobre la facturación.
            </p>
            <a
              href="mailto:ventas@clinica-odon.com"
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Contactar Soporte →
            </a>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}
