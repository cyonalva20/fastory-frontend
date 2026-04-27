import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/api/apiClient";
import { AuthService } from "@/api/authService";

interface SuscripcionEstado {
  estadoSuscripcion: string;
  fechaVencimiento: string | null;
  diasRestantes: number;
  mensaje: string;
}

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  suscripcionEstado: SuscripcionEstado | null;
  refreshSuscripcion: () => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  suscripcionEstado: null,
  refreshSuscripcion: async () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsedState] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suscripcionEstado, setSuscripcionEstado] = useState<SuscripcionEstado | null>(null);

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem("sidebar-collapsed", String(value));
  };

  const refreshSuscripcion = async () => {
    if (!AuthService.isAuthenticated()) return;
    try {
      const data = await apiRequest<SuscripcionEstado>("/api/v1/suscripcion/estado", {
        method: "GET",
      });
      setSuscripcionEstado(data);
    } catch (err) {
      console.error("Error fetching subscription state in Context:", err);
    }
  };

  useEffect(() => {
    refreshSuscripcion();
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen, suscripcionEstado, refreshSuscripcion }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
