"use client";

import { useEffect, useState } from "react";
import { Bot, Zap } from "lucide-react";
import Link from "next/link";

interface SubscriptionData {
  subscription: {
    planType: string;
    aiQueriesLimit: number;
    aiQueriesUsed: number;
  };
}

export function SidebarSubscription() {
  const [data, setData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription) {
          setData(data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  if (!data) return null;

  const { subscription } = data;
  const isUnlimited = subscription.aiQueriesLimit === -1;
  const percentage = isUnlimited
    ? 0
    : Math.min(
        100,
        (subscription.aiQueriesUsed / subscription.aiQueriesLimit) * 100
      );

  const isLimitReached =
    !isUnlimited && subscription.aiQueriesUsed >= subscription.aiQueriesLimit;

  return (
    <div className="px-4 mt-auto mb-4">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Plan {subscription.planType}
          </span>
          {isLimitReached && (
            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              Lleno
            </span>
          )}
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 flex items-center">
              <Bot className="w-3 h-3 mr-1" /> IA
            </span>
            <span
              className={`font-medium ${
                isLimitReached ? "text-red-600" : "text-gray-900"
              }`}
            >
              {subscription.aiQueriesUsed} /{" "}
              {isUnlimited ? "∞" : subscription.aiQueriesLimit}
            </span>
          </div>
          {!isUnlimited && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  isLimitReached ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          )}
        </div>

        <Link
          href="/dashboard/subscription"
          className="block w-full text-center py-2 px-3 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
        >
          Gestionar Plan
        </Link>
      </div>
    </div>
  );
}
