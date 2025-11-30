import { prisma } from "@/lib/db/prisma";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { PLAN_CONFIGS, isUnlimited } from "./subscription-plans";

export type LimitResource = "patients" | "users" | "ai_queries";

export async function getSubscription(tenantId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  // If no subscription exists, create a default STARTER plan
  if (!subscription) {
    const starterPlan = PLAN_CONFIGS[SubscriptionPlan.STARTER];

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Calculate period end (1 month from now)
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    subscription = await prisma.subscription.create({
      data: {
        tenantId,
        planType: SubscriptionPlan.STARTER,
        status: SubscriptionStatus.TRIAL,
        maxPatients: starterPlan.maxPatients,
        maxUsers: starterPlan.maxUsers,
        aiQueriesLimit: starterPlan.aiQueriesLimit,
        trialEndsAt,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  return subscription;
}

export async function checkSubscriptionLimit(
  tenantId: string,
  resource: LimitResource
): Promise<{
  allowed: boolean;
  message?: string;
  currentUsage: number;
  limit: number;
}> {
  const subscription = await getSubscription(tenantId);

  // Check status
  if (
    subscription.status === SubscriptionStatus.CANCELED ||
    subscription.status === SubscriptionStatus.EXPIRED ||
    subscription.status === SubscriptionStatus.PAST_DUE
  ) {
    return {
      allowed: false,
      message: "Tu suscripción no está activa. Por favor actualiza tu plan.",
      currentUsage: 0,
      limit: 0,
    };
  }

  let limit = 0;
  let currentUsage = 0;

  switch (resource) {
    case "patients":
      limit = subscription.maxPatients;
      if (isUnlimited(limit))
        return { allowed: true, currentUsage: 0, limit: -1 };

      currentUsage = await prisma.patient.count({
        where: { tenantId },
      });
      break;

    case "users":
      limit = subscription.maxUsers;
      if (isUnlimited(limit))
        return { allowed: true, currentUsage: 0, limit: -1 };

      currentUsage = await prisma.user.count({
        where: { tenantId },
      });
      break;

    case "ai_queries":
      limit = subscription.aiQueriesLimit;
      if (isUnlimited(limit))
        return { allowed: true, currentUsage: 0, limit: -1 };

      currentUsage = subscription.aiQueriesUsed;
      break;
  }

  if (currentUsage >= limit) {
    return {
      allowed: false,
      message: `Has alcanzado el límite de ${resource} de tu plan actual (${limit}). Actualiza a un plan superior para continuar.`,
      currentUsage,
      limit,
    };
  }

  return { allowed: true, currentUsage, limit };
}

export async function incrementAiUsage(tenantId: string) {
  const subscription = await getSubscription(tenantId);

  // Don't increment if unlimited
  if (isUnlimited(subscription.aiQueriesLimit)) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      aiQueriesUsed: { increment: 1 },
    },
  });
}

export async function upgradeSubscription(
  tenantId: string,
  newPlan: SubscriptionPlan
) {
  const planConfig = PLAN_CONFIGS[newPlan];
  const now = new Date();
  const periodEnd = new Date();

  if (planConfig.billingPeriod === "year") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else if (planConfig.billingPeriod === "month") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    // Lifetime - set to 100 years
    periodEnd.setFullYear(periodEnd.getFullYear() + 100);
  }

  return await prisma.subscription.update({
    where: { tenantId },
    data: {
      planType: newPlan,
      status: SubscriptionStatus.ACTIVE,
      maxPatients: planConfig.maxPatients,
      maxUsers: planConfig.maxUsers,
      aiQueriesLimit: planConfig.aiQueriesLimit,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      // Reset usage on upgrade? Maybe keep it or reset based on policy.
      // For now, let's not reset AI usage to avoid gaming, or reset if it's a new period.
      // Let's assume upgrade starts a new period.
      aiQueriesUsed: 0,
    },
  });
}
