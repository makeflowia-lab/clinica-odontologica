// Utilidades para exportar datos a Excel
import * as XLSX from "xlsx";

export const exportToExcel = (
  data: any[],
  filename: string,
  sheetName: string = "Datos"
) => {
  // Crear un nuevo libro de trabajo
  const workbook = XLSX.utils.book_new();

  // Convertir los datos a una hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generar el archivo y descargarlo
  XLSX.writeFile(
    workbook,
    `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};

export const exportAppointmentsToExcel = (appointments: any[]) => {
  const data = appointments.map((apt) => ({
    ID: apt.id,
    Paciente: apt.patientName,
    Email: apt.patientEmail,
    Teléfono: apt.patientPhone,
    Fecha: apt.date,
    Hora: apt.time,
    "Duración (min)": apt.duration,
    Motivo: apt.reason,
    Estado: apt.status,
    Notas: apt.notes || "",
  }));

  exportToExcel(data, "citas", "Citas");
};

export const exportInventoryToExcel = (items: any[]) => {
  const data = items.map((item) => ({
    ID: item.id,
    Producto: item.name,
    Categoría: item.category,
    "Stock Actual": item.quantity,
    Unidad: item.unit,
    "Stock Mínimo": item.minStock,
    "Precio Unitario": item.price,
    Proveedor: item.supplier,
    "Última Actualización": item.lastUpdated,
    "Valor Total": item.quantity * item.price,
  }));

  exportToExcel(data, "inventario", "Inventario");
};

export const exportInvoicesToExcel = (invoices: any[]) => {
  const data = invoices.map((inv) => ({
    "Número de Factura": inv.invoiceNumber,
    Paciente: inv.patientName,
    Fecha: inv.date,
    Vencimiento: inv.dueDate,
    Servicios: inv.services.join(", "),
    Subtotal: inv.subtotal,
    Impuesto: inv.tax,
    Total: inv.total,
    Estado: inv.status,
    "Método de Pago": inv.paymentMethod || "",
  }));

  exportToExcel(data, "facturas", "Facturas");
};
