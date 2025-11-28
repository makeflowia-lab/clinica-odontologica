"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface Settings {
  profile: {
    name: string;
    email: string;
    phone: string;
    specialty: string;
  };
  clinic: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    appointmentReminders: boolean;
    paymentAlerts: boolean;
  };
  security: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  language: string;
  timezone: string;
  aiApiKey: string;
  invoiceColor?: string;
  invoiceFooter?: string;
  invoiceTerms?: string;
  billing?: {
    taxId?: string;
    logo?: string;
    clinicName?: string;
    dentistName?: string;
    phone?: string;
    email?: string;
  };
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const defaultSettings: Settings = {
  profile: { name: "", email: "", phone: "", specialty: "" },
  clinic: { name: "", address: "", phone: "", email: "", logo: "" },
  notifications: {
    email: true,
    sms: false,
    appointmentReminders: true,
    paymentAlerts: true,
  },
  security: { currentPassword: "", newPassword: "", confirmPassword: "" },
  language: "es",
  timezone: "America/Mexico_City",
  aiApiKey: "",
  invoiceColor: "#2563eb",
  invoiceFooter: "",
  invoiceTerms: "",
  billing: {
    taxId: "",
    logo: "",
    clinicName: "",
    dentistName: "",
    phone: "",
    email: "",
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
            clinic: { ...prev.clinic, ...data.clinic },
            profile: { ...prev.profile, ...data.profile },
            notifications: { ...prev.notifications, ...data.notifications },
          }));
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, refreshSettings, loading }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
