"use client";

import { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  Minus,
  Search,
  Edit,
  Trash2,
  X,
  Download,
} from "lucide-react";
import { exportInventoryToExcel } from "@/lib/excel-export";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  price: number;
  supplier: string;
  lastUpdated?: string;
}

import { Modal } from "@/app/components/ui/Modal";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showUsedModal, setShowUsedModal] = useState(false);
  const [usedItemId, setUsedItemId] = useState<string>("");
  const [usedQuantity, setUsedQuantity] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: "",
    category: "Protección",
    quantity: "" as any,
    unit: "unidades",
    minStock: "" as any,
    price: "" as any,
    supplier: "",
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });

  const showAlert = (title: string, message: string) => {
    setModalState({ isOpen: true, title, message, type: "alert" });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setModalState({ isOpen: true, title, message, type: "confirm", onConfirm });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();

        // Category translation map (English to Spanish)
        const categoryTranslation: Record<string, string> = {
          PROTECTION: "Protección",
          FILLING: "Empaste",
          CROWN: "Corona",
          IMPLANT: "Implante",
          ORTHODONTIC: "Ortodoncia",
          CONSUMABLE: "Consumible",
          EQUIPMENT: "Equipo",
          MEDICATION: "Medicamento",
          OTHER: "Otro",
        };

        const mappedItems = data.materials.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: categoryTranslation[item.category] || item.category, // Translate category
          quantity: item.stockQuantity, // Correct field name
          unit: item.unit,
          minStock: item.minStockLevel, // Correct field name
          price: item.unitPrice, // Correct field name
          supplier: item.supplier || "",
          lastUpdated: item.updatedAt || new Date().toISOString(),
        }));
        setItems(mappedItems);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };

  const filteredItems = items.filter((item) => {
    const searchMatch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const categoryMatch =
      filterCategory === "all" || item.category === filterCategory;
    return searchMatch && categoryMatch;
  });

  const lowStockItems = items.filter((item) => item.quantity <= item.minStock);
  const totalValue = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const handleCreateItem = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          quantity: formData.quantity === "" ? 0 : Number(formData.quantity),
          unit: formData.unit,
          minStock: formData.minStock === "" ? 0 : Number(formData.minStock),
          costPerUnit: formData.price === "" ? 0 : Number(formData.price), // Map price to costPerUnit
          supplier: formData.supplier,
        }),
      });

      if (response.ok) {
        loadItems();
        setShowNewModal(false);
        resetForm();
      } else {
        const errorData = await response.json();
        showAlert("Error", errorData.error || "Error al crear el producto");
      }
    } catch (error) {
      console.error("Error creating item:", error);
      showAlert("Error", "Error al crear el producto");
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock,
      price: item.price,
      supplier: item.supplier,
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async () => {
    if (editingItem) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/inventory?id=${editingItem.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            quantity: formData.quantity === "" ? 0 : Number(formData.quantity),
            unit: formData.unit,
            minStock: formData.minStock === "" ? 0 : Number(formData.minStock),
            costPerUnit: formData.price === "" ? 0 : Number(formData.price),
            supplier: formData.supplier,
          }),
        });

        if (response.ok) {
          loadItems();
          setShowEditModal(false);
          setEditingItem(null);
          resetForm();
        } else {
          showAlert("Error", "Error al actualizar el producto");
        }
      } catch (error) {
        console.error("Error updating item:", error);
        alert("Error al actualizar el producto");
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("¿Está seguro de eliminar este producto del inventario?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/inventory?id=${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          loadItems();
        } else {
          showAlert("Error", "Error al eliminar el producto");
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Error al eliminar el producto");
      }
    }
  };

  const handleDeductStock = async () => {
    if (!usedItemId || usedQuantity <= 0) {
      showAlert("Error", "Seleccione un producto y una cantidad válida");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/inventory/used", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: usedItemId, quantity: usedQuantity }),
      });
      if (response.ok) {
        loadItems();
        setShowUsedModal(false);
        setUsedItemId("");
        setUsedQuantity(0);
        showAlert("Éxito", "Stock actualizado correctamente");
      } else {
        const errorData = await response.json();
        showAlert("Error", errorData.error || "Error al actualizar el stock");
      }
    } catch (error) {
      console.error("Error deducting stock:", error);
      showAlert("Error", "Error al actualizar el stock");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Protección",
      quantity: "" as any,
      unit: "unidades",
      minStock: "" as any,
      price: "" as any,
      supplier: "",
    });
  };

  const handleExport = () => {
    exportInventoryToExcel(items);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">
            Control de materiales y suministros
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            title="Exportar inventario a Excel"
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            title="Agregar nuevo producto al inventario"
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Producto</span>
          </button>
          <button
            title="Ingreso de Inventario Usado"
            onClick={() => setShowUsedModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Minus className="w-4 h-4" />
            <span>Ingreso Usado</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600">
                {lowStockItems.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalValue.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categorías</p>
              <p className="text-2xl font-bold text-gray-600">
                {new Set(items.map((i) => i.category)).size}
              </p>
            </div>
            <Package className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-red-800 font-semibold mb-1">
                Alerta de Stock Bajo
              </h3>
              <p className="text-red-700 text-sm">
                {lowStockItems.length} producto(s) por debajo del nivel mínimo:
                <span className="font-medium">
                  {" "}
                  {lowStockItems.map((i) => i.name).join(", ")}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              title="Buscar productos"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              title="Filtrar por categoría"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              <option value="Protección">Protección</option>
              <option value="Medicamentos">Medicamentos</option>
              <option value="Materiales">Materiales</option>
              <option value="Instrumental">Instrumental</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Mín.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
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
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-8 h-8 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.quantity <= item.minStock ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center w-fit">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Bien
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          title="Editar producto"
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          title="Eliminar producto"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nuevo Producto */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Nuevo Producto
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  title="Nombre del producto"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    title="Categoría del producto"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Protección">Protección</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Materiales">Materiales</option>
                    <option value="Instrumental">Instrumental</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad *
                  </label>
                  <select
                    title="Unidad de medida"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="cajas">Cajas</option>
                    <option value="frascos">Frascos</option>
                    <option value="tubos">Tubos</option>
                    <option value="sets">Sets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Actual *
                  </label>
                  <input
                    type="number"
                    title="Cantidad en stock"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="Ej: 100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    title="Stock mínimo (alerta)"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStock:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="Ej: 10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    title="Precio por unidad"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="Ej: 12.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    title="Nombre del proveedor"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
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
                  title="Agregar producto"
                  onClick={handleCreateItem}
                  disabled={!formData.name || !formData.supplier}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Producto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Producto */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Editar Producto
              </h2>
              <button
                title="Cerrar"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  title="Nombre del producto"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    title="Categoría del producto"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Protección">Protección</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Materiales">Materiales</option>
                    <option value="Instrumental">Instrumental</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad *
                  </label>
                  <select
                    title="Unidad de medida"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="cajas">Cajas</option>
                    <option value="frascos">Frascos</option>
                    <option value="tubos">Tubos</option>
                    <option value="sets">Sets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Actual *
                  </label>
                  <input
                    type="number"
                    title="Cantidad en stock"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="Ej: 100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    title="Stock mínimo (alerta)"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStock:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="Ej: 10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    title="Precio por unidad"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="Ej: 12.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    title="Nombre del proveedor"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  title="Cancelar"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  title="Actualizar producto"
                  onClick={handleUpdateItem}
                  disabled={!formData.name || !formData.supplier}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ingreso de Inventario Usado */}
      {showUsedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Ingreso de Inventario Usado
              </h2>
              <button
                title="Cerrar"
                onClick={() => {
                  setShowUsedModal(false);
                  setUsedItemId("");
                  setUsedQuantity(0);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto *
                </label>
                <select
                  title="Seleccionar producto"
                  value={usedItemId}
                  onChange={(e) => setUsedItemId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione un producto</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a deducir *
                </label>
                <input
                  type="number"
                  title="Cantidad a deducir"
                  value={usedQuantity}
                  onChange={(e) => setUsedQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  title="Cancelar"
                  onClick={() => {
                    setShowUsedModal(false);
                    setUsedItemId("");
                    setUsedQuantity(0);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  title="Deductir"
                  onClick={handleDeductStock}
                  disabled={!usedItemId || usedQuantity <= 0}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Minus className="w-4 h-4" />
                  <span>Deductir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
