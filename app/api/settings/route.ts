import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

const SETTINGS_KEY = "app_settings";

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    verifyToken(token);

    const setting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    // Default settings if not found
    const defaultSettings = {
      profile: { name: "", email: "", phone: "", specialty: "" },
      clinic: { name: "", address: "", phone: "", email: "", logo: "" },
      notifications: {
        email: true,
        sms: false,
        appointmentReminders: true,
        paymentAlerts: true,
      },
      security: { currentPassword: "", newPassword: "", confirmPassword: "" },
      aiApiKey: "",
      timezone: "America/Mexico_City",
    };

    return NextResponse.json(setting?.value || defaultSettings);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(
      request.headers.get("authorization") || ""
    );
    if (!token)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    verifyToken(token);

    const body = await request.json();

    const setting = await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: body },
      create: { key: SETTINGS_KEY, value: body },
    });

    return NextResponse.json(setting.value);
  } catch (error) {
    console.error("Save settings error:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
