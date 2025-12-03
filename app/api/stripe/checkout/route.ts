import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { PLAN_CONFIGS } from "@/lib/subscription-plans";
import { SubscriptionPlan } from "@prisma/client";

const settingsUrl = process.env.NEXT_PUBLIC_APP_URL + "/dashboard/subscription";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !Object.values(SubscriptionPlan).includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const planConfig = PLAN_CONFIGS[plan as SubscriptionPlan];

    if (!planConfig.stripePriceId) {
      return NextResponse.json(
        { error: "Plan not configured for payments" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      mode:
        planConfig.billingPeriod === "lifetime" ? "payment" : "subscription",
      success_url: `${settingsUrl}?success=true`,
      cancel_url: `${settingsUrl}?canceled=true`,
      customer_email: user.email,
      metadata: {
        tenantId: user.tenantId,
        userId: user.userId,
        plan: plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    );
  }
}
