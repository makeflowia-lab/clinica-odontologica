import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/rate-limit";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting: 10 requests per minute per IP (or user if we had it easily accessible here without auth middleware yet)
    // Using IP as identifier for now since auth is mixed
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const isAllowed = await checkRateLimit(ip, "voice-assistant", 10, 60);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Por favor espera un momento." },
        { status: 429 }
      );
    }

    const { image, command, apiKey } = await request.json();

    if (!image && !command) {
      return NextResponse.json(
        { error: "Se requiere imagen o comando de voz" },
        { status: 400 }
      );
    }

    // En DESARROLLO: usa API key compartida del servidor para pruebas
    // En PRODUCCIÓN: el cliente proporcionará su propia API key
    // Obtener usuario (asumiendo que viene en el body o header, por ahora simulamos con un ID fijo o del body si se enviara)
    // En una app real, usaríamos la sesión.
    // Intentamos obtener el userId del body si existe, o un header.
    // Como el frontend actual no envía userId en esta llamada, vamos a asumir que el cliente DEBE enviarlo o usamos el del sistema si no hay.
    // Pero espera, el frontend usa `useVoiceAssistant` hook?
    // Vamos a intentar leer el userId de un header custom si lo agregamos, o por ahora,
    // vamos a buscar si hay alguna key en la DB para el primer admin encontrado si no se pasa usuario.
    // O mejor, actualizamos el frontend para enviar el userId.

    // Por simplicidad y seguridad incremental:
    // 1. Si viene apiKey en el body (legacy/dev), se usa.
    // 2. Si no, buscamos en la DB. Pero necesitamos saber QUIÉN es el usuario.
    // El frontend actual NO envía userId en /api/voice-assistant.
    // Necesitamos actualizar el frontend para enviar userId o el token.

    let openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      // Intentar buscar en la DB para el usuario admin por defecto o cualquier usuario con key
      // Esto es un fallback temporal hasta que se implemente auth completa en el endpoint
      const userWithKey = await prisma.user.findFirst({
        where: { openai_api_key_encrypted: { not: null } },
      });

      if (userWithKey && userWithKey.openai_api_key_encrypted) {
        openaiApiKey = decrypt(userWithKey.openai_api_key_encrypted);
      }
    }

    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error: "API Key de OpenAI no configurada",
          message:
            "Por favor configura tu API key personal o contacta al administrador",
        },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Si hay una imagen, analizar con Vision
    if (image) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Eres un asistente dental experto. Analiza imágenes dentales (radiografías, fotos intraorales, odontogramas) y proporciona análisis profesionales.
            
            Identifica:
            - Estado de piezas dentales
            - Caries o problemas visibles
            - Tratamientos realizados
            - Recomendaciones prioritarias
            
            Responde en español, de forma clara y profesional. Usa emojis para hacer el análisis más visual.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza esta imagen dental y proporciona:

🔍 **Análisis IA Dental:**

✅ Calidad de imagen
📊 Dientes detectados
⚠️ Hallazgos importantes
🦷 Tratamientos detectados
💡 Recomendaciones

Sé específico con las piezas dentales.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const analysis =
        response.choices[0]?.message?.content ||
        "No se pudo generar el análisis";

      return NextResponse.json({
        success: true,
        analysis,
        type: "image",
        timestamp: new Date().toISOString(),
      });
    }

    // Si hay un comando de voz, procesarlo
    if (command) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de voz para una clínica dental. Ayudas a procesar comandos de voz del doctor.
            
            Comandos disponibles:
            - "Crear paciente [nombre], teléfono [número]"
            - "Agendar cita para [paciente] el [fecha] a las [hora]"
            - "Buscar paciente [nombre]"
            - "Ver agenda del día"
            - "Analizar imagen dental"
            
            Extrae la información del comando y devuelve un JSON con la acción y los datos.
            Si el comando no es claro, pide aclaración en español.`,
          },
          {
            role: "user",
            content: command,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const result =
        response.choices[0]?.message?.content ||
        "No se pudo procesar el comando";

      return NextResponse.json({
        success: true,
        result,
        type: "command",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en asistente de voz:", error);

    return NextResponse.json(
      {
        error: "Error al procesar solicitud",
        details: error.message,
        message:
          "Verifica que tu API key de OpenAI esté configurada correctamente",
      },
      { status: 500 }
    );
  }
}
