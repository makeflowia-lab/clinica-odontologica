"use client";

import { useEffect } from "react";

export default function DigitalAssistant() {
  useEffect(() => {
    // Evitar cargar múltiples veces si ya existe
    if (document.getElementById("n8n-chat-script")) return;

    // Cargar el CSS
    const link = document.createElement("link");
    link.id = "n8n-chat-style";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css";
    document.head.appendChild(link);

    // Agregar CSS personalizado para ocultar errores y controlar visibilidad
    const customStyle = document.createElement("style");
    customStyle.id = "n8n-custom-style";
    customStyle.innerHTML = `
      /* Ocultar mensajes de error del widget de n8n */
      .n8n-chat-widget .error,
      .n8n-chat-widget [class*="error"],
      .n8n-chat-widget [class*="Error"] {
        display: none !important;
      }
      
      /* Asegurar que el widget solo aparezca en páginas autenticadas */
      .n8n-chat-widget {
        display: none !important;
      }
      
      /* Mostrar solo cuando esté dentro del dashboard */
      body:has([data-dashboard="true"]) .n8n-chat-widget {
        display: block !important;
      }
    `;
    document.head.appendChild(customStyle);

    // Cargar el script del chat
    const script = document.createElement("script");
    script.id = "n8n-chat-script";
    script.type = "module";
    script.innerHTML = `
      import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';
      
      window.n8nChat = createChat({
        webhookUrl: 'https://n8n-n8n.gpr07a.easypanel.host/webhook/44e723a6-6869-40de-a887-e9df1d22d191/chat',
        mode: 'window',
        showWelcomeScreen: true,
        initialMessages: [
          'Hola, soy tu asistente digital. ¿En qué puedo ayudarte hoy?'
        ],
        i18n: {
          en: {
            title: 'Asistente Digital',
            subtitle: 'Clínica Odontológica',
            footer: '',
            getStarted: 'Iniciar Chat',
            inputPlaceholder: 'Escribe tu mensaje...',
          },
        },
      });
    `;
    document.body.appendChild(script);

    // Marcar el body como dashboard
    document.body.setAttribute("data-dashboard", "true");

    return () => {
      // Limpieza al desmontar
      const existingLink = document.getElementById("n8n-chat-style");
      const existingScript = document.getElementById("n8n-chat-script");
      const existingCustomStyle = document.getElementById("n8n-custom-style");

      if (existingLink) document.head.removeChild(existingLink);
      if (existingScript) document.body.removeChild(existingScript);
      if (existingCustomStyle) document.head.removeChild(existingCustomStyle);

      // Remover el atributo del body
      document.body.removeAttribute("data-dashboard");

      // Intentar limpiar el widget del DOM
      const widgets = document.querySelectorAll(".n8n-chat-widget");
      widgets.forEach((w) => w.remove());
    };
  }, []);

  return null;
}
