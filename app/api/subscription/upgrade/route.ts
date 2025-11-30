import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { upgradeSubscription } from "@/lib/subscription";
import { SubscriptionPlan } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can upgrade
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can upgrade the subscription" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !Object.values(SubscriptionPlan).includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const updatedSubscription = await upgradeSubscription(user.tenantId, plan);

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      { error: "Error upgrading subscription" },
      { status: 500 }
    );
  }
}
