import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { z } from "zod";

const usedInventorySchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

// POST: Deduct stock from inventory
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
    const data = usedInventorySchema.parse(body);

    // Get the current material and verify it belongs to tenant
    const material = await prisma.material.findFirst({
      where: {
        id: data.itemId,
        tenantId: user.tenantId, // Enforce tenant isolation
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Check if there's enough stock
    if (material.stockQuantity < data.quantity) {
      return NextResponse.json(
        {
          error: `Stock insuficiente. Stock actual: ${material.stockQuantity}`,
        },
        { status: 400 }
      );
    }

    // Deduct the quantity from stock
    const updatedMaterial = await prisma.material.update({
      where: { id: data.itemId },
      data: {
        stockQuantity: material.stockQuantity - data.quantity,
      },
    });

    return NextResponse.json({
      material: updatedMaterial,
      message: "Stock actualizado correctamente",
    });
  } catch (error) {
    console.error("Deduct stock error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el stock" },
      { status: 500 }
    );
  }
}
