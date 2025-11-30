import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
});

const invoiceSchema = z.object({
  patientId: z.string().min(1),
  date: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema).min(1),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "PAID", "CANCELLED", "OVERDUE"]).optional(),
  paymentMethod: z.string().optional(),
});

// GET: List invoices
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const user = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const whereClause: any = {
      tenantId: user.tenantId, // Enforce tenant isolation
    };

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        items: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json(
      { error: "Error al obtener facturas" },
      { status: 500 }
    );
  }
}

// POST: Create invoice
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const user = verifyToken(token);

    const body = await request.json();
    const data = invoiceSchema.parse(body);

    // Verify patient belongs to tenant
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, tenantId: user.tenantId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const itemsData = data.items.map((item) => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
      };
    });

    const taxRate = 0.16; // 16% IVA example, could be configurable
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generate Invoice Number (Scoped to Tenant)
    // Try to find a unique number
    let invoiceNumber = "";
    let isUnique = false;
    let attempts = 0;

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: { tenantId: user.tenantId },
    });

    let currentSequence = count + 1;

    while (!isUnique && attempts < 5) {
      invoiceNumber = `INV-${year}-${currentSequence
        .toString()
        .padStart(4, "0")}`;

      // Check if this number exists (globally or for tenant, depending on schema)
      const existing = await prisma.invoice.findUnique({
        where: { invoiceNumber },
      });

      if (!existing) {
        isUnique = true;
      } else {
        currentSequence++;
        attempts++;
      }
    }

    if (!isUnique) {
      // Fallback: append random string if we can't find a sequential one
      invoiceNumber = `INV-${year}-${currentSequence}-${Math.floor(
        Math.random() * 1000
      )}`;
    }

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: user.tenantId, // Assign to tenant
        invoiceNumber,
        patientId: data.patientId,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
        subtotal,
        tax,
        total,
        status: data.status || "PENDING",
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        patient: true,
      },
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al crear factura",
        details: error,
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete invoice
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const user = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    // Verify invoice belongs to tenant
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Factura eliminada" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return NextResponse.json(
      { error: "Error al eliminar factura" },
      { status: 500 }
    );
  }
}

// PATCH: Update invoice (status, notes, etc)
export async function PATCH(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const user = verifyToken(token);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    // Verify invoice belongs to tenant
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json(
      { error: "Error al actualizar factura" },
      { status: 500 }
    );
  }
}
