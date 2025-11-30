"use client";

import { useEffect, useState } from "react";
import {
  Check,
  AlertTriangle,
  CreditCard,
  Users,
  User,
  Bot,
} from "lucide-react";

interface SubscriptionData {
  subscription: {
    planType: string;
    status: string;
    maxPatients: number;
    maxUsers: number;
    aiQueriesLimit: number;
    aiQueriesUsed: number;
    currentPeriodEnd: string;
  };
  planConfig: {
    displayName: string;
    price: number;
    billingPeriod: string;
  };
}

export function SubscriptionStatus() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription) {
          setData(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="animate-pulse h-40 bg-gray-100 rounded-lg"></div>;
  if (!data) return null;

  const { subscription, planConfig } = data;

  const isUnlimited = (val: number) => val === -1;
  const getPercentage = (used: number, limit: number) => {
    if (isUnlimited(limit)) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  // Fetch actual counts (mocked here, ideally passed from API or fetched)
  // For now we only have aiQueriesUsed in subscription object.
  // Patients and Users counts would need another API call or be included in subscription API.
  // Let's assume for now we only show AI usage accurately and static limits for others unless we fetch counts.

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tu Plan Actual
          </h3>
          <p className="text-blue-600 font-medium text-xl mt-1">
            {planConfig.displayName}
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            subscription.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : subscription.status === "TRIAL"
              ? "bg-blue-100 text-blue-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {subscription.status === "TRIAL"
            ? "Prueba Gratuita"
            : subscription.status === "ACTIVE"
            ? "Activo"
            : subscription.status}
        </div>
      </div>

      <div className="space-y-6">
        {/* AI Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center text-gray-600">
              <Bot className="w-4 h-4 mr-2" /> Consultas IA
            </span>
            <span className="font-medium">
              {subscription.aiQueriesUsed} /{" "}
              {isUnlimited(subscription.aiQueriesLimit)
                ? "Ilimitado"
                : subscription.aiQueriesLimit}
            </span>
          </div>
          {!isUnlimited(subscription.aiQueriesLimit) && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  getPercentage(
                    subscription.aiQueriesUsed,
                    subscription.aiQueriesLimit
                  ) > 90
                    ? "bg-red-500"
                    : "bg-blue-600"
                }`}
                style={{
                  width: `${getPercentage(
                    subscription.aiQueriesUsed,
                    subscription.aiQueriesLimit
                  )}%`,
                }}
              ></div>
            </div>
          )}
        </div>

        {/* Limits Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              Pacientes:{" "}
              <strong>
                {isUnlimited(subscription.maxPatients)
                  ? "Ilimitados"
                  : subscription.maxPatients}
              </strong>
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              Usuarios:{" "}
              <strong>
                {isUnlimited(subscription.maxUsers)
                  ? "Ilimitados"
                  : subscription.maxUsers}
              </strong>
            </span>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => (window.location.href = "/dashboard/subscription")}
            className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Gestionar Suscripción
          </button>
        </div>
      </div>
    </div>
  );
}
