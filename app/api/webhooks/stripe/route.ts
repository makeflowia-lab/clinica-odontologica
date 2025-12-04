import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db/prisma";
import { SubscriptionStatus, SubscriptionPlan } from "@prisma/client";
import { PLAN_CONFIGS } from "@/lib/subscription-plans";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const tenantId = session?.metadata?.tenantId;
    const plan = session?.metadata?.plan as SubscriptionPlan;

    if (!tenantId || !plan) {
      return new NextResponse("Tenant ID and Plan are required", {
        status: 400,
      });
    }

    const planConfig = PLAN_CONFIGS[plan];
    if (!planConfig) {
      return new NextResponse("Invalid plan configuration", { status: 400 });
    }

    let subscriptionId = session.subscription as string;
    let customerId = session.customer as string;
    let priceId = undefined;
    let currentPeriodStart = new Date();
    let currentPeriodEnd = new Date();

    // Handle Subscription Mode
    if (session.mode === "subscription" && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      priceId = subscription.items.data[0].price.id;
      currentPeriodStart = new Date(subscription.current_period_start * 1000);
      currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }
    // Handle Lifetime/Payment Mode
    else if (session.mode === "payment") {
      // For lifetime, we set a long period (e.g., 100 years)
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100);
      priceId = planConfig.stripePriceId;
    }

    await prisma.subscription.update({
      where: {
        tenantId: tenantId,
      },
      data: {
        planType: plan,
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: subscriptionId, // Might be null for lifetime
        stripeCustomerId: customerId,
        stripePriceId: priceId,

        // Update Limits based on new plan
        maxPatients: planConfig.maxPatients,
        maxUsers: planConfig.maxUsers,
        aiQueriesLimit: planConfig.aiQueriesLimit,

        // Update Periods
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await prisma.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  if (event.type === "customer.subscription.updated") {
    // Logic to handle plan changes (upgrades/downgrades) would go here
    // For now, we rely on the fact that checkout.session.completed handles the initial setup
    // and we might need to sync status if it changes to past_due etc.
    const subscription = event.data.object as Stripe.Subscription;

    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status:
          subscription.status === "active"
            ? SubscriptionStatus.ACTIVE
            : subscription.status === "past_due"
            ? SubscriptionStatus.PAST_DUE
            : subscription.status === "canceled"
            ? SubscriptionStatus.CANCELED
            : SubscriptionStatus.ACTIVE, // Default fallback
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await prisma.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: SubscriptionStatus.CANCELED,
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
