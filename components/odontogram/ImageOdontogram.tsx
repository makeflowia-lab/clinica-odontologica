"use client";

import React, { useState, useEffect, useRef } from "react";

export type ToothStatus =
  | "HEALTHY"
  | "CAVITY"
  | "FILLED"
  | "CROWN"
  | "MISSING"
  | "IMPLANT"
  | "ROOT_CANAL";

interface ToothData {
  id: number;
  status: ToothStatus;
  notes?: string;
  surfaces?: {
    occlusal: ToothStatus;
    mesial: ToothStatus;
    distal: ToothStatus;
    buccal: ToothStatus;
    lingual: ToothStatus;
  };
}

interface ImageOdontogramProps {
  initialData?: Record<string, any>;
  onSave?: (data: any) => void;
  readOnly?: boolean;
  imageUrl?: string;
}

const TOOTH_NUMBERS = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46,
  45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

export default function ImageOdontogram({
  initialData,
  onSave,
  readOnly = false,
  imageUrl = "/odontograma.png",
}: ImageOdontogramProps) {
  const [toothData, setToothData] = useState<Record<string, ToothData>>({});
  const [selectedStatus, setSelectedStatus] = useState<ToothStatus>("CAVITY");
  const currentImage = "/odontograma1.png";

  // Positioning State
  const [positions, setPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const [isEditingPositions, setIsEditingPositions] = useState(false);
  const [draggingTooth, setDraggingTooth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgKey, setImgKey] = useState(Date.now());

  // Default positions generator (Curved Dental Arch)
  const getDefaultPositions = () => {
    const initialPos: Record<number, { x: number; y: number }> = {};

    const setPos = (id: number, x: number, y: number) => {
      initialPos[id] = { x, y };
    };

    // Upper Arch (Curved downwards)
    setPos(18, 5, 35);
    setPos(17, 11, 31);
    setPos(16, 17, 27);
    setPos(15, 23, 23);
    setPos(14, 29, 20);
    setPos(13, 35, 17);
    setPos(12, 41, 15);
    setPos(11, 47, 14);

    setPos(21, 53, 14);
    setPos(22, 59, 15);
    setPos(23, 65, 17);
    setPos(24, 71, 20);
    setPos(25, 77, 23);
    setPos(26, 83, 27);
    setPos(27, 89, 31);
    setPos(28, 95, 35);

    // Lower Arch (Curved upwards)
    setPos(48, 5, 65);
    setPos(47, 11, 69);
    setPos(46, 17, 73);
    setPos(45, 23, 77);
    setPos(44, 29, 80);
    setPos(43, 35, 83);
    setPos(42, 41, 85);
    setPos(41, 47, 86);

    setPos(31, 53, 86);
    setPos(32, 59, 85);
    setPos(33, 65, 83);
    setPos(34, 71, 80);
    setPos(35, 77, 77);
    setPos(36, 83, 73);
    setPos(37, 89, 69);
    setPos(38, 95, 65);

    return initialPos;
  };

  // Load positions from localStorage on mount
  useEffect(() => {
    setImgKey(Date.now());

    const savedPositions = localStorage.getItem("odontogram_positions_v4");
    if (savedPositions) {
      setPositions(JSON.parse(savedPositions));
    } else {
      setPositions(getDefaultPositions());
    }
  }, []);

  // Save positions helper
  const savePositions = (
    newPositions: Record<number, { x: number; y: number }>
  ) => {
    localStorage.setItem(
      "odontogram_positions_v4",
      JSON.stringify(newPositions)
    );
  };

  const handleResetPositions = () => {
    if (confirm("¿Restablecer posiciones originales?")) {
      const defaults = getDefaultPositions();
      setPositions(defaults);
      savePositions(defaults);
    }
  };

  useEffect(() => {
    if (initialData) {
      setToothData(initialData);
    }
  }, [initialData]);

  const handleRefreshImage = () => {
    setImgKey(Date.now());
  };

  const handleToothClick = (number: number) => {
    if (readOnly && !isEditingPositions) return;
    if (isEditingPositions) return;

    setToothData((prev) => {
      const currentTooth = prev[number] || {
        id: number,
        status: "HEALTHY",
        surfaces: {
          occlusal: "HEALTHY",
          mesial: "HEALTHY",
          distal: "HEALTHY",
          buccal: "HEALTHY",
          lingual: "HEALTHY",
        },
      };

      let newData = { ...currentTooth };
      if (newData.status === selectedStatus) {
        newData.status = "HEALTHY";
      } else {
        newData.status = selectedStatus;
      }
      return { ...prev, [number]: newData };
    });
  };

  const handleMouseDown = (e: React.MouseEvent, number: number) => {
    if (!isEditingPositions) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling
    setDraggingTooth(number);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTooth === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values to 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setPositions((prev) => ({
      ...prev,
      [draggingTooth]: { x: clampedX, y: clampedY },
    }));
  };

  const handleMouseUp = () => {
    if (draggingTooth !== null) {
      // Save on drop
      savePositions(positions);
      setDraggingTooth(null);
    }
  };

  const getColor = (status: ToothStatus) => {
    switch (status) {
      case "CAVITY":
        return "bg-red-500 border-red-600";
      case "FILLED":
        return "bg-blue-500 border-blue-600";
      case "CROWN":
        return "bg-yellow-500 border-yellow-600";
      case "MISSING":
        return "bg-gray-800 border-gray-900";
      case "IMPLANT":
        return "bg-green-500 border-green-600";
      case "ROOT_CANAL":
        return "bg-purple-500 border-purple-600";
      default:
        return "bg-white/80 border-gray-400 hover:bg-white";
    }
  };

  const tools = [
    { id: "HEALTHY", label: "Sano", color: "bg-white border-gray-300" },
    { id: "CAVITY", label: "Caries", color: "bg-red-500 text-white" },
    { id: "FILLED", label: "Obturación", color: "bg-blue-500 text-white" },
    { id: "CROWN", label: "Corona", color: "bg-yellow-500 text-white" },
    { id: "MISSING", label: "Ausente", color: "bg-gray-800 text-white" },
    { id: "IMPLANT", label: "Implante", color: "bg-green-500 text-white" },
    {
      id: "ROOT_CANAL",
      label: "Endodoncia",
      color: "bg-purple-500 text-white",
    },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      {!readOnly && (
        <div className="mb-4 space-y-4">
          {/* Header & Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Herramientas</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshImage}
                className="text-xs text-gray-500 hover:text-gray-700"
                title="Recargar Imagen"
              >
                🔄
              </button>
              {isEditingPositions && (
                <button
                  onClick={handleResetPositions}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Resetear
                </button>
              )}
              <button
                onClick={() => setIsEditingPositions(!isEditingPositions)}
                className={`text-xs px-2 py-1 rounded border ${
                  isEditingPositions
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {isEditingPositions ? "Terminar Edición" : "Mover Dientes"}
              </button>
            </div>
          </div>

          {/* Tools Palette */}
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedStatus(tool.id as ToothStatus)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedStatus === tool.id
                    ? "ring-2 ring-offset-1 ring-blue-500 " + tool.color
                    : "hover:bg-gray-50 " +
                      (tool.id === "HEALTHY"
                        ? "bg-white border-gray-300"
                        : "bg-white text-gray-700 border-gray-200")
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>

          {isEditingPositions && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
              ℹ️ Arrastra los círculos numéricos para colocarlos exactamente
              sobre cada diente en la imagen.
            </div>
          )}
        </div>
      )}

      {/* Odontogram Container - Original Size (max-w-xl) */}
      <div
        ref={containerRef}
        className={`relative w-full max-w-xl mx-auto border rounded-lg bg-white select-none overflow-hidden ${
          isEditingPositions ? "cursor-crosshair ring-2 ring-blue-200" : ""
        }`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Image */}
        <img
          src={`${currentImage}?t=${imgKey}`}
          alt="Odontograma Base"
          className="w-full h-auto object-contain pointer-events-none block"
        />

        {/* Interactive Markers */}
        {TOOTH_NUMBERS.map((num) => {
          const pos = positions[num] || { x: 0, y: 0 };
          const data = toothData[num];
          const status = data?.status || "HEALTHY";
          const colorClass = getColor(status);
          const isHealthy = status === "HEALTHY";

          return (
            <div
              key={num}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                position: "absolute",
                transform: "translate(-50%, -50%)", // Center the marker on the coords
                width: "20px", // Slightly smaller markers
                height: "20px",
              }}
              onMouseDown={(e) => handleMouseDown(e, num)}
              onClick={() => handleToothClick(num)}
              className={`
                    flex items-center justify-center rounded-full border shadow-sm transition-colors
                    ${colorClass}
                    ${isHealthy ? "text-gray-600" : "text-white"}
                    text-[9px] font-bold
                    ${
                      isEditingPositions
                        ? "cursor-move hover:scale-110 z-10"
                        : "cursor-pointer hover:scale-105"
                    }
                    ${
                      draggingTooth === num
                        ? "scale-125 z-20 ring-2 ring-blue-400"
                        : ""
                    }
                `}
              title={`Diente ${num}`}
            >
              {num}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onSave && onSave(toothData)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium shadow-sm"
          >
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
}
