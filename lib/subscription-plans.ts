// Subscription Plans Configuration
import { SubscriptionPlan } from "@prisma/client";

export interface PlanConfig {
  name: string;
  displayName: string;
  price: number;
  billingPeriod: "month" | "year" | "lifetime";
  maxPatients: number; // -1 for unlimited
  maxUsers: number; // -1 for unlimited
  aiQueriesLimit: number; // -1 for unlimited
  features: string[];
  supportLevel: string;
  supportResponseTime: string;
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.STARTER]: {
    name: "STARTER",
    displayName: "Plan Starter",
    price: 39,
    billingPeriod: "month",
    maxPatients: 100,
    maxUsers: 1,
    aiQueriesLimit: 50,
    features: [
      "Acceso completo a todos los módulos",
      "Hasta 100 pacientes activos",
      "1 usuario incluido",
      "50 consultas de IA por mes",
      "Soporte por email",
    ],
    supportLevel: "Email",
    supportResponseTime: "48 horas",
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    name: "PROFESSIONAL",
    displayName: "Plan Profesional",
    price: 69,
    billingPeriod: "month",
    maxPatients: -1, // unlimited
    maxUsers: 3,
    aiQueriesLimit: 200,
    features: [
      "Acceso completo a todos los módulos",
      "Pacientes ilimitados",
      "Hasta 3 usuarios",
      "200 consultas de IA por mes",
      "Soporte prioritario",
      "Reportes avanzados",
      "Respaldo automático diario",
    ],
    supportLevel: "Prioritario",
    supportResponseTime: "24 horas",
  },
  [SubscriptionPlan.ANNUAL]: {
    name: "ANNUAL",
    displayName: "Plan Anual",
    price: 580,
    billingPeriod: "year",
    maxPatients: -1, // unlimited
    maxUsers: 3,
    aiQueriesLimit: -1, // unlimited
    features: [
      "TODO lo del Plan Profesional",
      "Asistente IA ILIMITADO",
      "Soporte prioritario (12h)",
      "1 sesión de capacitación",
      "Actualizaciones incluidas",
      "2 meses gratis",
    ],
    supportLevel: "Prioritario Plus",
    supportResponseTime: "12 horas",
  },
  [SubscriptionPlan.ENTERPRISE]: {
    name: "ENTERPRISE",
    displayName: "Plan Enterprise",
    price: 2500,
    billingPeriod: "lifetime",
    maxPatients: -1, // unlimited
    maxUsers: -1, // unlimited
    aiQueriesLimit: -1, // unlimited
    features: [
      "Instalación dedicada",
      "Personalización completa",
      "Usuarios ilimitados",
      "IA ilimitada por 2 años",
      "Soporte VIP (4h)",
      "Capacitación completa",
      "Migración de datos",
      "Código fuente incluido",
    ],
    supportLevel: "VIP",
    supportResponseTime: "4 horas",
  },
};

export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function formatLimit(value: number, unit: string = ""): string {
  if (isUnlimited(value)) {
    return "Ilimitado";
  }
  return `${value}${unit ? " " + unit : ""}`;
}
