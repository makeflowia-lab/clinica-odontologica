import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { image, apiKey } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "No se proporcionó imagen" },
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

    // Análisis con GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Eres un asistente dental experto especializado en análisis de odontogramas. 
          Tu tarea es analizar imágenes de odontogramas dentales y proporcionar un análisis detallado y profesional.
          
          Debes identificar:
          - Estado de cada pieza dental visible
          - Caries o cavidades presentes
          - Tratamientos dentales realizados (restauraciones, coronas, puentes, etc.)
          - Desgaste dental o fracturas
          - Cualquier anomalía o problema dental visible
          - Recomendaciones de tratamiento prioritarias
          
          Proporciona el análisis en español, de forma clara, profesional y estructurada.
          Usa emojis apropiados para hacer el reporte más visual.
          Incluye una sección de recomendaciones al final.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza esta imagen de odontograma dental en detalle. Proporciona:

1. 🔍 ANÁLISIS GENERAL
   - Calidad de la imagen
   - Número de dientes visibles
   - Estado general de la dentadura

2. ⚠️ HALLAZGOS IMPORTANTES
   - Caries detectadas (especificar piezas dentales)
   - Desgaste o fracturas
   - Problemas de encías si son visibles

3. 🦷 TRATAMIENTOS DETECTADOS
   - Restauraciones (amalgamas, resinas)
   - Coronas o puentes
   - Implantes
   - Otros tratamientos visibles

4. 💡 RECOMENDACIONES
   - Tratamientos prioritarios
   - Seguimiento recomendado
   - Prevención

Sé específico con las piezas dentales usando la nomenclatura dental estándar (1-32 o cuadrantes).
Mantén un tono profesional pero comprensible.`,
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
      max_tokens: 1500,
      temperature: 0.3,
    });

    const analysis =
      response.choices[0]?.message?.content || "No se pudo generar el análisis";

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en análisis de odontograma:", error);

    return NextResponse.json(
      {
        error: "Error al analizar el odontograma",
        details: error.message,
        message:
          "Verifica que tu API key de OpenAI esté configurada correctamente y tenga acceso a GPT-4 Vision",
      },
      { status: 500 }
    );
  }
}
