import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSubscription } from "@/lib/subscription";
import { PLAN_CONFIGS } from "@/lib/subscription-plans";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getSubscription(user.tenantId);
    const planConfig = PLAN_CONFIGS[subscription.planType];

    return NextResponse.json({
      subscription,
      planConfig,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Error fetching subscription" },
      { status: 500 }
    );
  }
}
