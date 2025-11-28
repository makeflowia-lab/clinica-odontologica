import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { z } from "zod";

const voiceCommandSchema = z.object({
  transcript: z.string().min(1),
  language: z.string().default("es-ES"),
});

// Funciones auxiliares para procesar comandos
// Funciones auxiliares para procesar comandos
async function processVoiceCommand(
  transcript: string,
  userId: string,
  token: string
) {
  const lowerTranscript = transcript.toLowerCase();

  // Comandos de creación de paciente
  if (
    lowerTranscript.includes("crear") &&
    lowerTranscript.includes("paciente")
  ) {
    return await handleCreatePatient(transcript, userId, token);
  }

  // Comandos de agendar cita
  if (lowerTranscript.includes("agendar") || lowerTranscript.includes("cita")) {
    return await handleCreateAppointment(transcript, userId);
  }

  // Comandos de búsqueda
  if (
    lowerTranscript.includes("buscar") ||
    lowerTranscript.includes("encontrar")
  ) {
    return await handleSearch(transcript, userId);
  }

  // Comando de ver agenda
  if (
    lowerTranscript.includes("agenda") ||
    lowerTranscript.includes("citas del día")
  ) {
    return await handleViewSchedule(transcript, userId);
  }

  return {
    success: false,
    message:
      'No entendí el comando. Intenta con: "crear paciente", "agendar cita", "ver agenda", etc.',
    suggestedActions: [
      "Crear nuevo paciente",
      "Agendar cita",
      "Ver agenda del día",
      "Buscar paciente",
    ],
  };
}

async function handleCreatePatient(
  transcript: string,
  userId: string,
  token: string
) {
  // Usar OpenAI para extraer información del paciente
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de una clínica dental. Extrae la siguiente información del texto en formato JSON:
            {
              "firstName": "nombre",
              "lastName": "apellidos",
              "phone": "teléfono",
              "email": "correo (opcional)",
              "dateOfBirth": "fecha de nacimiento en formato YYYY-MM-DD (opcional)",
              "gender": "M, F o OTHER (opcional)"
            }
            Si falta información crítica (nombre, apellido o teléfono), indica qué falta en un campo "missing".`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const extracted = JSON.parse(data.choices[0].message.content);

    if (extracted.missing) {
      return {
        success: false,
        message: `Necesito más información: ${extracted.missing}`,
        action: "REQUEST_MORE_INFO",
        data: extracted,
      };
    }

    // Crear paciente usando la API
    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/patients`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Use the actual token
        },
        body: JSON.stringify(extracted),
      }
    );

    if (createResponse.ok) {
      const patient = await createResponse.json();
      return {
        success: true,
        message: `Paciente ${extracted.firstName} ${extracted.lastName} creado correctamente.`,
        action: "PATIENT_CREATED",
        data: patient,
      };
    } else {
      return {
        success: false,
        message: "Error al crear el paciente. Por favor, verifica los datos.",
        action: "ERROR",
      };
    }
  } catch (error) {
    console.error("Voice command error:", error);
    return {
      success: false,
      message: "Error al procesar el comando de voz.",
      action: "ERROR",
    };
  }
}

async function handleCreateAppointment(transcript: string, userId: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Extrae información de cita dental en formato JSON:
            {
              "patientName": "nombre del paciente",
              "date": "fecha en formato YYYY-MM-DD",
              "time": "hora en formato HH:MM",
              "type": "tipo de cita (CONSULTATION, CLEANING, etc.)",
              "duration": "duración en minutos (default 30)"
            }
            Si falta información, indica qué falta en "missing".`,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const extracted = JSON.parse(data.choices[0].message.content);

    if (extracted.missing) {
      return {
        success: false,
        message: `Necesito más información: ${extracted.missing}`,
        action: "REQUEST_MORE_INFO",
        data: extracted,
      };
    }

    return {
      success: true,
      message: `Preparando cita para ${extracted.patientName} el ${extracted.date} a las ${extracted.time}.`,
      action: "APPOINTMENT_READY",
      data: extracted,
    };
  } catch (error) {
    console.error("Voice appointment error:", error);
    return {
      success: false,
      message: "Error al procesar la cita.",
      action: "ERROR",
    };
  }
}

async function handleSearch(transcript: string, userId: string) {
  // Extraer término de búsqueda
  const searchTerm = transcript
    .replace(/buscar|encontrar|paciente/gi, "")
    .trim();

  return {
    success: true,
    message: `Buscando: ${searchTerm}`,
    action: "SEARCH",
    data: { query: searchTerm },
  };
}

async function handleViewSchedule(transcript: string, userId: string) {
  const today = new Date().toISOString().split("T")[0];

  return {
    success: true,
    message: "Mostrando agenda del día",
    action: "VIEW_SCHEDULE",
    data: { date: today },
  };
}

// API endpoint
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
    const { transcript } = voiceCommandSchema.parse(body);

    const result = await processVoiceCommand(transcript, user.userId, token);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Voice AI error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al procesar comando de voz" },
      { status: 500 }
    );
  }
}
