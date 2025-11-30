"use client";

import React, { useState, useEffect } from "react";

// Tipos de estado para cada diente/superficie
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

interface OdontogramProps {
  initialData?: Record<string, any>;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

const TOOTH_NUMBERS = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46,
  45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

const Tooth = ({
  number,
  data,
  onClick,
  selectedStatus,
}: {
  number: number;
  data?: ToothData;
  onClick: (n: number, surface: string) => void;
  selectedStatus: ToothStatus;
}) => {
  const getColor = (status: ToothStatus) => {
    switch (status) {
      case "CAVITY":
        return "#ef4444"; // Red
      case "FILLED":
        return "#3b82f6"; // Blue
      case "CROWN":
        return "#eab308"; // Gold/Yellow
      case "MISSING":
        return "#1f2937"; // Dark Gray (X)
      case "IMPLANT":
        return "#10b981"; // Green
      case "ROOT_CANAL":
        return "#8b5cf6"; // Purple
      default:
        return "transparent"; // Transparent for overlay
    }
  };

  const surfaces = data?.surfaces || {
    occlusal: "HEALTHY",
    mesial: "HEALTHY",
    distal: "HEALTHY",
    buccal: "HEALTHY",
    lingual: "HEALTHY",
  };

  const mainStatus = data?.status || "HEALTHY";
  const isMissing = mainStatus === "MISSING";

  // Determine tooth type based on number
  const toothType = (() => {
    const lastDigit = number % 10;
    if (lastDigit === 1 || lastDigit === 2) return "incisor";
    if (lastDigit === 3) return "canine";
    if (lastDigit === 4 || lastDigit === 5) return "premolar";
    return "molar";
  })();

  // Determine quadrant for orientation
  const quadrant = Math.floor(number / 10);
  const isLower = quadrant === 3 || quadrant === 4;

  return (
    <div className="flex flex-col items-center m-1 relative">
      <span className="text-xs font-bold text-gray-600 mb-1 select-none">
        {number}
      </span>
      <div
        className={`relative w-16 h-24 flex-shrink-0 ${
          isLower ? "rotate-180" : ""
        }`}
      >
        {isMissing ? (
          <svg
            viewBox="0 0 100 150"
            className="w-full h-full cursor-pointer"
            onClick={() => onClick(number, "whole")}
          >
            {/* Silhouette for missing tooth */}
            <path
              d="M20,40 Q20,10 50,10 Q80,10 80,40 L75,140 L25,140 Z"
              fill="#f3f4f6"
              stroke="#d1d5db"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <line
              x1="20"
              y1="20"
              x2="80"
              y2="140"
              stroke="#ef4444"
              strokeWidth="6"
            />
            <line
              x1="80"
              y1="20"
              x2="20"
              y2="140"
              stroke="#ef4444"
              strokeWidth="6"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  style={{ stopColor: "#ffffff", stopOpacity: 1 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "#f1f5f9", stopOpacity: 1 }}
                />
              </linearGradient>
            </defs>

            {/* BASE SHAPE (Root + Crown Body) - Symmetric & Regular */}
            <g>
              {toothType === "incisor" && (
                <path
                  d="M25,50 L35,140 Q50,145 65,140 L75,50 Q80,45 80,40 Q80,10 50,10 Q20,10 20,40 Q20,45 25,50 Z"
                  fill="url(#toothGrad)"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
              )}
              {toothType === "canine" && (
                <path
                  d="M25,50 L40,145 L60,145 L75,50 Q80,45 80,40 Q80,10 50,5 Q20,10 20,40 Q20,45 25,50 Z"
                  fill="url(#toothGrad)"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
              )}
              {toothType === "premolar" && (
                <path
                  d="M20,55 L40,140 L60,140 L80,55 Q85,50 85,40 Q85,15 50,15 Q15,15 15,40 Q15,50 20,55 Z"
                  fill="url(#toothGrad)"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
              )}
              {toothType === "molar" && (
                <path
                  d="M15,60 L30,140 L45,130 L55,130 L70,140 L85,60 Q90,50 90,40 Q90,15 50,15 Q10,15 10,40 Q10,50 15,60 Z"
                  fill="url(#toothGrad)"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
              )}
            </g>

            {/* INTERACTIVE SURFACES - Geometric & Clear */}

            {/* Center (Occlusal) */}
            <path
              d={
                toothType === "molar" || toothType === "premolar"
                  ? "M35,35 L65,35 L65,55 L35,55 Z" // Rectangular for molars/premolars
                  : "M35,30 L65,30 L65,50 L35,50 Z" // Slightly higher for anterior
              }
              fill={getColor(surfaces.occlusal)}
              stroke={
                surfaces.occlusal !== "HEALTHY"
                  ? getColor(surfaces.occlusal)
                  : "#cbd5e1"
              }
              strokeWidth="2"
              fillOpacity="0.9"
              className="cursor-pointer hover:opacity-60"
              onClick={() => onClick(number, "occlusal")}
            />

            {/* Top (Buccal) */}
            <path
              d={
                toothType === "molar" || toothType === "premolar"
                  ? "M15,40 Q15,15 50,15 Q85,15 85,40 L65,35 L35,35 Z"
                  : "M20,40 Q20,10 50,10 Q80,10 80,40 L65,30 L35,30 Z"
              }
              fill={getColor(surfaces.buccal)}
              stroke={
                surfaces.buccal !== "HEALTHY"
                  ? getColor(surfaces.buccal)
                  : "none"
              }
              strokeWidth="2"
              fillOpacity="0.8"
              className="cursor-pointer hover:opacity-60"
              onClick={() => onClick(number, "buccal")}
            />

            {/* Bottom (Lingual) - Mapped to the neck area visually */}
            <path
              d={
                toothType === "molar" || toothType === "premolar"
                  ? "M35,55 L65,55 L85,40 Q85,50 80,55 L70,140 L55,130 L45,130 L30,140 L20,55 Q15,50 15,40 Z"
                  : "M35,50 L65,50 L80,40 Q80,45 75,50 L65,140 Q50,145 35,140 L25,50 Q20,45 20,40 Z"
              }
              fill={getColor(surfaces.lingual)}
              stroke={
                surfaces.lingual !== "HEALTHY"
                  ? getColor(surfaces.lingual)
                  : "none"
              }
              strokeWidth="2"
              fillOpacity="0.8"
              className="cursor-pointer hover:opacity-60"
              onClick={() => onClick(number, "lingual")}
            />

            {/* Left (Mesial) */}
            <path
              d={
                toothType === "molar" || toothType === "premolar"
                  ? "M15,40 L35,35 L35,55 L20,55 Q15,50 15,40 Z"
                  : "M20,40 L35,30 L35,50 L25,50 Q20,45 20,40 Z"
              }
              fill={getColor(surfaces.mesial)}
              stroke={
                surfaces.mesial !== "HEALTHY"
                  ? getColor(surfaces.mesial)
                  : "none"
              }
              strokeWidth="2"
              fillOpacity="0.8"
              className="cursor-pointer hover:opacity-60"
              onClick={() => onClick(number, "mesial")}
            />

            {/* Right (Distal) */}
            <path
              d={
                toothType === "molar" || toothType === "premolar"
                  ? "M85,40 L65,35 L65,55 L80,55 Q85,50 85,40 Z"
                  : "M80,40 L65,30 L65,50 L75,50 Q80,45 80,40 Z"
              }
              fill={getColor(surfaces.distal)}
              stroke={
                surfaces.distal !== "HEALTHY"
                  ? getColor(surfaces.distal)
                  : "none"
              }
              strokeWidth="2"
              fillOpacity="0.8"
              className="cursor-pointer hover:opacity-60"
              onClick={() => onClick(number, "distal")}
            />
          </svg>
        )}
      </div>
    </div>
  );
};

export default function Odontogram({
  initialData,
  onSave,
  readOnly = false,
}: OdontogramProps) {
  const [toothData, setToothData] = useState<Record<string, ToothData>>({});
  const [selectedStatus, setSelectedStatus] = useState<ToothStatus>("CAVITY");

  useEffect(() => {
    if (initialData) {
      setToothData(initialData);
    }
  }, [initialData]);

  const handleToothClick = (number: number, surface: string) => {
    if (readOnly) return;

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

      if (selectedStatus === "MISSING") {
        // Toggle missing status for whole tooth
        newData.status = newData.status === "MISSING" ? "HEALTHY" : "MISSING";
      } else {
        // Update specific surface
        if (surface === "whole") {
          // If clicking a missing tooth, reset it
          newData.status = "HEALTHY";
        } else if (newData.surfaces) {
          const surfaceKey = surface as keyof NonNullable<
            ToothData["surfaces"]
          >;
          newData.surfaces[surfaceKey] =
            newData.surfaces[surfaceKey] === selectedStatus
              ? "HEALTHY"
              : selectedStatus;
        }
      }

      const updated = { ...prev, [number]: newData };
      return updated;
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(toothData);
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {!readOnly && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Herramientas
          </h3>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedStatus(tool.id as ToothStatus)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedStatus === tool.id
                    ? "ring-2 ring-offset-2 ring-blue-500 " + tool.color
                    : "hover:bg-gray-50 " +
                      (tool.id === "HEALTHY"
                        ? "bg-white border-gray-300"
                        : "bg-white text-gray-700 border-gray-200")
                }`}
              >
                {tool.id !== "HEALTHY" && tool.id !== "MISSING" && (
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      tool.color.split(" ")[0]
                    }`}
                  ></span>
                )}
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable container for mobile - keeps everything aligned */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-max flex flex-col items-center space-y-8 py-4">
          {/* Upper Teeth */}
          <div className="flex gap-1">
            {TOOTH_NUMBERS.slice(0, 16).map((num) => (
              <Tooth
                key={num}
                number={num}
                data={toothData[num]}
                onClick={handleToothClick}
                selectedStatus={selectedStatus}
              />
            ))}
          </div>

          {/* Lower Teeth */}
          <div className="flex gap-1">
            {TOOTH_NUMBERS.slice(16).map((num) => (
              <Tooth
                key={num}
                number={num}
                data={toothData[num]}
                onClick={handleToothClick}
                selectedStatus={selectedStatus}
              />
            ))}
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
          >
            Guardar Odontograma
          </button>
        </div>
      )}
    </div>
  );
}
