import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { z } from "zod";
import { MaterialCategory } from "@prisma/client";

// Category mapping from Spanish to English enum
const categoryMap: Record<string, MaterialCategory> = {
  Protección: MaterialCategory.PROTECTION,
  Empaste: MaterialCategory.FILLING,
  Corona: MaterialCategory.CROWN,
  Implante: MaterialCategory.IMPLANT,
  Ortodoncia: MaterialCategory.ORTHODONTIC,
  Consumible: MaterialCategory.CONSUMABLE,
  Equipo: MaterialCategory.EQUIPMENT,
  Medicamento: MaterialCategory.MEDICATION,
  Otro: MaterialCategory.OTHER,
};

const materialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(0),
  unit: z.string().min(1),
  minStock: z.number().int().min(0).default(10),
  costPerUnit: z.number().positive(),
  category: z.string().min(1), // Accept string, will map to enum
  expirationDate: z.string().optional().nullable(),
  supplier: z.string().optional(),
});

// GET: List materials
export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock") === "true";

    const whereClause: any = {
      tenantId: user.tenantId, // Enforce tenant isolation
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    if (lowStock) {
      whereClause.stockQuantity = {
        lte: prisma.material.fields.minStockLevel,
      };
    }

    const materials = await prisma.material.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Get inventory error:", error);
    return NextResponse.json(
      { error: "Error al obtener inventario" },
      { status: 500 }
    );
  }
}

// POST: Create material
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    const body = await request.json();
    const data = materialSchema.parse(body);

    // Map Spanish category to enum
    const mappedCategory = categoryMap[data.category] || MaterialCategory.OTHER;

    const material = await prisma.material.create({
      data: {
        tenantId: user.tenantId, // Assign to tenant
        name: data.name,
        category: mappedCategory,
        supplier: data.supplier,
        unitPrice: data.costPerUnit,
        stockQuantity: data.quantity,
        minStockLevel: data.minStock,
        unit: data.unit,
        expiryDate: data.expirationDate ? new Date(data.expirationDate) : null,
      },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error("Create material error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear material" },
      { status: 500 }
    );
  }
}

// PATCH: Update material
export async function PATCH(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const body = await request.json();
    const data = materialSchema.partial().parse(body);

    // Verify material belongs to tenant
    const existingMaterial = await prisma.material.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material no encontrado" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) {
      updateData.category =
        categoryMap[data.category] || MaterialCategory.OTHER;
    }
    if (data.supplier !== undefined) updateData.supplier = data.supplier;
    if (data.costPerUnit !== undefined) updateData.unitPrice = data.costPerUnit;
    if (data.quantity !== undefined) updateData.stockQuantity = data.quantity;
    if (data.minStock !== undefined) updateData.minStockLevel = data.minStock;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.expirationDate !== undefined) {
      updateData.expiryDate = data.expirationDate
        ? new Date(data.expirationDate)
        : null;
    }

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ material });
  } catch (error) {
    console.error("Update material error:", error);
    return NextResponse.json(
      { error: "Error al actualizar material" },
      { status: 500 }
    );
  }
}

// DELETE: Delete material
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const user = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    // Verify material belongs to tenant
    const existingMaterial = await prisma.material.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material no encontrado" },
        { status: 404 }
      );
    }

    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Material eliminado" });
  } catch (error) {
    console.error("Delete material error:", error);
    return NextResponse.json(
      { error: "Error al eliminar material" },
      { status: 500 }
    );
  }
}
