"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  FileText,
  CreditCard,
  Download,
  Plus,
  X,
  FileDown,
  Search,
  DollarSign,
  Trash2,
} from "lucide-react";
import { exportInvoicesToExcel } from "@/lib/excel-export";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// TODO: Reemplazar con tu Publishable Key de Stripe en producción
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_KEY"
);

interface Invoice {
  id: string;
  invoiceNumber?: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "Pendiente" | "Pagada" | "Vencida" | "Cancelada";
  paymentMethod?: string;
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

function PaymentForm({
  invoice,
  onSuccess,
}: {
  invoice: Invoice;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setProcessing(true);
    setError("");

    try {
      // Simulación de procesamiento de pago (modo desarrollo)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Si Stripe está disponible, intentar crear PaymentMethod
      if (stripe && elements) {
        const cardElement = elements.getElement(CardElement);
        if (cardElement) {
          const { error: stripeError } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
          });
          if (stripeError) {
            console.warn("Stripe error (desarrollo):", stripeError.message);
          }
        }
      }

      // Actualizar factura como pagada via API
      const token = localStorage.getItem("token");
      const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: invoice.id,
          status: "PAID",
          paymentMethod: "Tarjeta de Crédito",
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la factura");
      }

      setProcessing(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Error al procesar el pago");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Total a pagar:</span>
          <span className="text-2xl font-bold text-gray-900">
            ${invoice.total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": { color: "#aab7c4" },
              },
              invalid: { color: "#9e2146" },
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
        <p className="font-medium">🔧 Modo de Desarrollo</p>
        <p className="text-xs mt-1">
          El pago se procesará localmente. En producción se conectará con Stripe
          real.
        </p>
      </div>

      <button
        type="submit"
        title="Procesar pago con tarjeta"
        disabled={processing}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <CreditCard className="w-5 h-5" />
        <span>{processing ? "Procesando..." : "Procesar Pago"}</span>
      </button>
    </form>
  );
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    notes: "",
  });

  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    // Cargar facturas
    loadInvoices();

    // Cargar pacientes
    const loadPatients = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/patients", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setPatients(data.patients || []);
        }
      } catch (error) {
        console.error("Error cargando pacientes:", error);
      }
    };
    loadPatients();
  }, []);

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/invoices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Map API response to UI Invoice interface
        const mappedInvoices: Invoice[] = data.invoices.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          patientId: inv.patientId,
          patientName: inv.patient
            ? `${inv.patient.firstName} ${inv.patient.lastName}`
            : "Desconocido",
          date: inv.date,
          dueDate: inv.dueDate,
          items: inv.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            price: Number(item.unitPrice), // API uses unitPrice
            total: Number(item.total || item.quantity * item.unitPrice),
          })),
          subtotal: Number(inv.subtotal),
          tax: Number(inv.tax),
          total: Number(inv.total),
          status: mapStatusToUI(inv.status),
          paymentMethod: inv.paymentMethod,
          notes: inv.notes,
        }));
        setInvoices(mappedInvoices);
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
    }
  };

  const mapStatusToUI = (
    status: string
  ): "Pendiente" | "Pagada" | "Vencida" | "Cancelada" => {
    const map: Record<string, any> = {
      PENDING: "Pendiente",
      PAID: "Pagada",
      OVERDUE: "Vencida",
      CANCELLED: "Cancelada",
    };
    return map[status] || "Pendiente";
  };

  const filteredInvoices = invoices.filter((inv) => {
    const searchMatch =
      inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const statusMatch = filterStatus === "all" || inv.status === filterStatus;
    return searchMatch && statusMatch;
  });

  const totalPendiente = invoices
    .filter((i) => i.status === "Pendiente")
    .reduce((sum, i) => sum + i.total, 0);
  const totalPagado = invoices
    .filter((i) => i.status === "Pagada")
    .reduce((sum, i) => sum + i.total, 0);
  const totalVencido = invoices
    .filter((i) => i.status === "Vencida")
    .reduce((sum, i) => sum + i.total, 0);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, price: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const tax = subtotal * 0.16; // 16% IVA
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleCreateInvoice = async () => {
    const { subtotal, tax, total } = calculateTotals();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          date: formData.date,
          dueDate: formData.dueDate,
          items: formData.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          status: "PENDING",
        }),
      });

      if (response.ok) {
        loadInvoices();
        setShowNewModal(false);
        resetForm();
      } else {
        alert("Error al crear la factura");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Error al crear la factura");
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      patientName: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
      items: [{ description: "", quantity: 1, price: 0 }],
      notes: "",
    });
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = async (
    method: "stripe" | "cash" | "paypal" | "transfer"
  ) => {
    setShowPaymentMethodModal(false);

    if (method === "stripe") {
      setShowPaymentModal(true);
      return;
    }

    // Procesar otros métodos de pago
    const methodNames: Record<string, string> = {
      cash: "Efectivo",
      paypal: "PayPal",
      transfer: "Transferencia Bancaria",
    };

    if (!selectedInvoice) {
      alert("Error: No se seleccionó ninguna factura");
      return;
    }

    try {
      // Simular procesamiento de pago
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Actualizar factura como pagada via API
      const token = localStorage.getItem("token");
      const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedInvoice.id,
          status: "PAID",
          paymentMethod: methodNames[method],
        }),
      });

      if (!response.ok) {
        alert("Error al actualizar la factura");
        return;
      }

      // Obtener la factura actualizada para el ticket
      // En una implementación real, la respuesta del PATCH podría devolver la factura actualizada
      const updatedInvoiceData = await response.json();
      const updatedInvoice = {
        ...selectedInvoice,
        status: "Pagada" as const,
        paymentMethod: methodNames[method],
      }; // Usamos los datos locales actualizados para el ticket inmediato o parseamos la respuesta

      if (updatedInvoice) {
        generateTicket(updatedInvoice, methodNames[method]);
      }

      loadInvoices();
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      alert("Error al procesar el pago. Por favor intente de nuevo.");
    }
  };

  const handlePaymentSuccess = async () => {
    if (!selectedInvoice) {
      setShowPaymentModal(false);
      return;
    }

    try {
      // Recargar facturas para obtener la versión actualizada
      await loadInvoices();

      // Generar ticket con los datos que ya tenemos (asumiendo éxito)
      if (selectedInvoice) {
        const updatedInvoice = {
          ...selectedInvoice,
          status: "Pagada" as const,
          paymentMethod: "Tarjeta de Crédito",
        };
        generateTicket(updatedInvoice, "Tarjeta de Crédito");
      }

      setShowPaymentModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error al generar ticket:", error);
      alert("Pago procesado pero hubo un error al generar el ticket");
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      loadInvoices();
    }
  };

  const generateTicket = (invoice: Invoice, paymentMethod: string) => {
    const now = new Date();
    const ticketContent = `
╔════════════════════════════════════════════════════════════╗
║          CLÍNICA DENTAL - COMPROBANTE DE PAGO             ║
╚════════════════════════════════════════════════════════════╝

FACTURA: ${invoice.id}
FECHA DE EMISIÓN: ${new Date(invoice.date).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
FECHA DE PAGO: ${now.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })} ${now.toLocaleTimeString("es-ES")}

────────────────────────────────────────────────────────────
PACIENTE: ${invoice.patientName}
ESTADO: ✓ PAGADO
MÉTODO DE PAGO: ${paymentMethod}
────────────────────────────────────────────────────────────

DETALLE DE SERVICIOS:
${invoice.items
  .map(
    (item, index) => `
${index + 1}. ${item.description}
   Cantidad: ${item.quantity} x $${item.price.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
   Subtotal: $${item.total.toLocaleString("es-ES", {
     minimumFractionDigits: 2,
     maximumFractionDigits: 2,
   })}
`
  )
  .join("")}
────────────────────────────────────────────────────────────

RESUMEN FINANCIERO:
Subtotal:          $${invoice.subtotal.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
IVA (16%):         $${invoice.tax.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
────────────────────────────────────────────────────────────
TOTAL PAGADO:      $${invoice.total.toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
════════════════════════════════════════════════════════════

${invoice.notes ? `NOTAS: ${invoice.notes}\n\n` : ""}
────────────────────────────────────────────────────────────
Este comprobante certifica el pago completo de los servicios
dentales descritos. Conserve para sus registros.

Para consultas: contacto@clinicadental.com
Teléfono: (555) 123-4567

Generado automáticamente el ${now.toLocaleString("es-ES")}
    `.trim();

    // Descargar como archivo de texto
    const blob = new Blob([ticketContent], {
      type: "text/plain; charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Comprobante_Pago_${invoice.id}_${now.getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mostrar confirmación con opciones de envío
    // Mostrar confirmación
    alert(
      `✅ PAGO REGISTRADO EXITOSAMENTE\n\n` +
        `Factura: ${invoice.id}\n` +
        `Paciente: ${invoice.patientName}\n` +
        `Total Pagado: $${invoice.total.toLocaleString()}\n` +
        `Método: ${paymentMethod}\n\n` +
        `📄 El comprobante se ha descargado automáticamente.`
    );
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!confirm(`¿Marcar factura ${invoice.id} como pagada?`)) {
      return;
    }

    try {
      // Actualizar factura como pagada via API
      const token = localStorage.getItem("token");
      const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: invoice.id,
          status: "PAID",
          paymentMethod: "Efectivo",
        }),
      });

      if (!response.ok) {
        alert("Error al actualizar la factura");
        return;
      }

      // Recargar facturas
      loadInvoices();

      // Generar ticket automáticamente
      const updatedInvoice = {
        ...invoice,
        status: "Pagada" as const,
        paymentMethod: "Efectivo",
      };
      generateTicket(updatedInvoice, "Efectivo");
    } catch (error) {
      console.error("Error al marcar como pagada:", error);
      alert("Error al procesar. Por favor intente de nuevo.");
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      // Importar jsPDF dinámicamente
      const { default: jsPDF } = await import("jspdf");

      const doc = new jsPDF();

      // Configuración
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Encabezado
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("CLINICA DENTAL", pageWidth / 2, y, { align: "center" });

      y += 10;
      doc.setFontSize(16);
      doc.text("FACTURA", pageWidth / 2, y, { align: "center" });

      y += 15;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Información de factura
      doc.text(`Factura N°: ${invoice.id}`, margin, y);
      y += 7;
      doc.text(
        `Fecha: ${new Date(invoice.date).toLocaleDateString()}`,
        margin,
        y
      );
      y += 7;
      doc.text(
        `Vencimiento: ${new Date(invoice.dueDate).toLocaleDateString()}`,
        margin,
        y
      );
      y += 7;
      doc.text(`Paciente: ${invoice.patientName}`, margin, y);
      y += 7;
      doc.text(`Estado: ${invoice.status}`, margin, y);

      if (invoice.paymentMethod) {
        y += 7;
        doc.text(`Metodo de Pago: ${invoice.paymentMethod}`, margin, y);
      }

      y += 15;

      // Línea separadora
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Encabezados de tabla
      doc.setFont("helvetica", "bold");
      doc.text("Descripcion", margin, y);
      doc.text("Cant.", pageWidth - 80, y);
      doc.text("Precio", pageWidth - 60, y);
      doc.text("Total", pageWidth - margin, y, { align: "right" });

      y += 7;
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // Items
      doc.setFont("helvetica", "normal");
      invoice.items.forEach((item) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.text(item.description, margin, y);
        doc.text(item.quantity.toString(), pageWidth - 80, y);
        doc.text(`$${item.price.toLocaleString()}`, pageWidth - 60, y);
        doc.text(`$${item.total.toLocaleString()}`, pageWidth - margin, y, {
          align: "right",
        });
        y += 7;
      });

      y += 5;
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Totales
      doc.text("Subtotal:", pageWidth - 60, y);
      doc.text(`$${invoice.subtotal.toLocaleString()}`, pageWidth - margin, y, {
        align: "right",
      });
      y += 7;

      doc.text("Impuesto (16%):", pageWidth - 60, y);
      doc.text(`$${invoice.tax.toLocaleString()}`, pageWidth - margin, y, {
        align: "right",
      });
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TOTAL:", pageWidth - 60, y);
      doc.text(`$${invoice.total.toLocaleString()}`, pageWidth - margin, y, {
        align: "right",
      });

      // Notas
      if (invoice.notes) {
        y += 15;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Notas:", margin, y);
        y += 7;
        const lines = doc.splitTextToSize(
          invoice.notes,
          pageWidth - 2 * margin
        );
        doc.text(lines, margin, y);
      }

      // Pie de página
      y = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("Gracias por su preferencia", pageWidth / 2, y, {
        align: "center",
      });

      // Guardar PDF
      doc.save(`factura-${invoice.id}.pdf`);

      alert(
        `✅ Factura ${invoice.id} descargada\n\n✓ Formato: PDF\n✓ Lista para imprimir o enviar`
      );
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar PDF. Por favor intente de nuevo.");
    }
  };

  const handleExport = () => {
    exportInvoicesToExcel(invoices);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-600 mt-1">Gestión de facturas y pagos</p>
        </div>
        <div className="flex space-x-3">
          <button
            title="Exportar facturas a Excel"
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            title="Crear nueva factura"
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Facturas</p>
              <p className="text-2xl font-bold text-gray-900">
                {invoices.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendiente</p>
              <p className="text-2xl font-bold text-yellow-600">
                $
                {totalPendiente.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pagado</p>
              <p className="text-2xl font-bold text-green-600">
                $
                {totalPagado.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencido</p>
              <p className="text-2xl font-bold text-red-600">
                $
                {totalVencido.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <FileText className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              title="Buscar facturas"
              placeholder="Buscar por paciente o número de factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              title="Filtrar por estado"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Pagada">Pagada</option>
              <option value="Vencida">Vencida</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron facturas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber ||
                          invoice.id.substring(0, 8) + "..."}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.patientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${invoice.total.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          invoice.status === "Pagada"
                            ? "bg-green-100 text-green-800"
                            : invoice.status === "Pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          title="Descargar PDF"
                          onClick={() => handleDownloadPDF(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          title="Eliminar factura"
                          onClick={async () => {
                            if (
                              confirm(
                                "¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer."
                              )
                            ) {
                              try {
                                const token = localStorage.getItem("token");
                                const response = await fetch(
                                  `/api/invoices?id=${invoice.id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );

                                if (response.ok) {
                                  loadInvoices();
                                } else {
                                  alert("Error al eliminar la factura");
                                }
                              } catch (error) {
                                console.error("Error deleting invoice:", error);
                                alert("Error al eliminar la factura");
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {invoice.status !== "Pagada" && (
                          <>
                            <button
                              title="Pagar con tarjeta (Stripe)"
                              onClick={() => handlePayInvoice(invoice)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              title="Marcar como pagada"
                              onClick={() => handleMarkAsPaid(invoice)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Factura */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Nueva Factura
              </h2>
              <button
                title="Cerrar"
                onClick={() => {
                  setShowNewModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <select
                    title="Seleccionar paciente"
                    value={formData.patientId}
                    onChange={(e) => {
                      const selectedPatient = patients.find(
                        (p) => p.id === e.target.value
                      );
                      setFormData({
                        ...formData,
                        patientId: e.target.value,
                        patientName: selectedPatient
                          ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                          : "",
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar paciente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    title="Fecha de la factura"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vencimiento *
                  </label>
                  <input
                    type="date"
                    title="Fecha de vencimiento"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conceptos
                  </h3>
                  <button
                    title="Agregar concepto"
                    onClick={handleAddItem}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-5">
                      <span className="text-xs font-medium text-gray-700">
                        Descripción
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-gray-700">
                        Cantidad
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-gray-700">
                        Precio
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-gray-700">
                        Total
                      </span>
                    </div>
                    <div className="col-span-1"></div>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <input
                          type="text"
                          title="Descripción del servicio o producto"
                          placeholder="Descripción"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          title="Cantidad"
                          placeholder="Cant."
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          title="Precio unitario"
                          placeholder="Precio"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "price",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          ${(item.quantity * item.price).toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        {formData.items.length > 1 && (
                          <button
                            title="Eliminar concepto"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        ${calculateTotals().subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA (16%):</span>
                      <span className="font-medium">
                        ${calculateTotals().tax.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${calculateTotals().total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  title="Notas adicionales"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  title="Cancelar"
                  onClick={() => {
                    setShowNewModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  title="Crear factura"
                  onClick={handleCreateInvoice}
                  disabled={!formData.patientName || !formData.dueDate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Factura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Método de Pago */}
      {showPaymentMethodModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Seleccionar Método de Pago
              </h2>
              <button
                title="Cerrar"
                onClick={() => {
                  setShowPaymentMethodModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Factura:</span>
                <span className="font-medium">{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Paciente:</span>
                <span className="font-medium">
                  {selectedInvoice.patientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total a pagar:</span>
                <span className="text-xl font-bold text-green-600">
                  ${selectedInvoice.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                title="Pagar con tarjeta de crédito/débito"
                onClick={() => handlePaymentMethodSelect("stripe")}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      Tarjeta de Crédito/Débito
                    </div>
                    <div className="text-sm text-gray-600">
                      Procesado por Stripe
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600">
                  →
                </span>
              </button>

              <button
                title="Pagar en efectivo"
                onClick={() => handlePaymentMethodSelect("cash")}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Efectivo</div>
                    <div className="text-sm text-gray-600">Pago en caja</div>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-green-600">
                  →
                </span>
              </button>

              <button
                title="Pagar con PayPal"
                onClick={() => handlePaymentMethodSelect("paypal")}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    P
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">PayPal</div>
                    <div className="text-sm text-gray-600">Pago en línea</div>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-yellow-600">
                  →
                </span>
              </button>

              <button
                title="Pagar con transferencia bancaria"
                onClick={() => handlePaymentMethodSelect("transfer")}
                className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      Transferencia Bancaria
                    </div>
                    <div className="text-sm text-gray-600">
                      SPEI / Internacional
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-purple-600">
                  →
                </span>
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Al confirmar el pago se generará un ticket automáticamente</p>
              <p className="mt-1">
                Disponible para envío por correo o WhatsApp
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago Stripe */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Procesar Pago con Tarjeta
              </h2>
              <button
                title="Cerrar"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Factura:</span>
                  <span className="font-medium">{selectedInvoice.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paciente:</span>
                  <span className="font-medium">
                    {selectedInvoice.patientName}
                  </span>
                </div>
              </div>
            </div>

            <Elements stripe={stripePromise}>
              <PaymentForm
                invoice={selectedInvoice}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>

            <div className="mt-4 text-center text-xs text-gray-500">
              <p>Pagos seguros procesados con Stripe</p>
              <p className="mt-1">
                En modo de desarrollo - No se realizarán cargos reales
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
