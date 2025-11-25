import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { image, command, apiKey } = await request.json();

    if (!image && !command) {
      return NextResponse.json(
        { error: "Se requiere imagen o comando de voz" },
        { status: 400 }
      );
    }

    // En DESARROLLO: usa API key compartida del servidor para pruebas
    // En PRODUCCIÓN: el cliente proporcionará su propia API key
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

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
