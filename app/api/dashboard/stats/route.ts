import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

// GET: Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    // Date ranges - expand window to handle timezone differences
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      23,
      59,
      59,
      999
    );

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Build where clause for dentist-specific data AND tenant isolation
    const baseFilter = { tenantId: user.tenantId };
    const dentistFilter =
      user.role === "DENTIST"
        ? { ...baseFilter, dentistId: user.userId }
        : baseFilter;

    // Parallel queries for all statistics
    const [
      todayAppointments,
      totalPatients,
      monthlyRevenue,
      pendingPayments,
      upcomingAppointments,
      completedTreatments,
      activeTreatments,
      lowStockItems,
    ] = await Promise.all([
      // Today's appointments count
      prisma.appointment.count({
        where: {
          ...dentistFilter,
          dateTime: {
            gte: today,
            lte: tomorrow,
          },
        },
      }),

      // Total patients (Tenant isolated)
      prisma.patient.count({
        where: baseFilter,
      }),

      // Monthly revenue from paid invoices (Tenant isolated)
      prisma.invoice.aggregate({
        where: {
          tenantId: user.tenantId,
          status: "PAID",
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          total: true,
        },
      }),

      // Pending payments (Tenant isolated)
      prisma.invoice.aggregate({
        where: {
          tenantId: user.tenantId,
          status: {
            in: ["PENDING", "OVERDUE"],
          },
        },
        _sum: {
          total: true,
          paid: true,
        },
      }),

      // Upcoming appointments (next 7 days)
      prisma.appointment.findMany({
        where: {
          ...dentistFilter,
          dateTime: {
            gte: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: {
            not: "CANCELLED",
          },
        },
        take: 5,
        orderBy: {
          dateTime: "asc",
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      // Completed treatments this month
      prisma.treatment.count({
        where: {
          ...dentistFilter,
          status: "COMPLETED",
          endDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Active treatments
      prisma.treatment.count({
        where: {
          ...dentistFilter,
          status: {
            in: ["IN_PROGRESS", "PLANNED"],
          },
        },
      }),

      // Low stock items (Tenant isolated)
      prisma.material.count({
        where: {
          tenantId: user.tenantId,
          stockQuantity: {
            lte: prisma.material.fields.minStockLevel,
          },
        },
      }),
    ]);

    // Calculate pending payment amount
    const pendingAmount =
      (pendingPayments._sum.total?.toNumber() || 0) -
      (pendingPayments._sum.paid?.toNumber() || 0);

    // Get low stock count (using count directly now)
    const lowStockCount = lowStockItems;

    const stats = {
      todayAppointments,
      totalPatients,
      monthlyRevenue: monthlyRevenue._sum.total?.toNumber() || 0,
      pendingPayments: pendingAmount,
      upcomingAppointments: upcomingAppointments.map((apt) => ({
        id: apt.id,
        dateTime: apt.dateTime,
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
        type: apt.type,
        status: apt.status,
      })),
      completedTreatments,
      activeTreatments,
      lowStockCount,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
