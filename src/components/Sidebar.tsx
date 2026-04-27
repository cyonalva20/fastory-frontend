import {
  BarChart3,
  Users,
  PackagePlus,
  Home,
  Menu,
  LogOut,
  FolderOpen,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  TableOfContents,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Truck,
  X,
  Building2,
  Shield,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";

interface SidebarProps {
  activeSection?: string;
}

// Menu item groups for visual separation
const menuGroups = [
  {
    label: "Inventario",
    items: [
      { id: "panel-principal", label: "Panel Principal", icon: Home, path: "/dashboard",
        allowedRoles: ["Administrador", "ADMINISTRADOR", "SUPERVISOR", "ALMACENERO", "VENDEDOR"] },
      { id: "nuevo-producto", label: "Nuevo Producto", icon: PackagePlus, path: "/nuevo-producto",
        allowedRoles: ["Administrador", "ADMINISTRADOR"] },
      { id: "entradas", label: "Registrar Entrada", icon: ArrowDownCircle, path: "/entradas",
        allowedRoles: ["Administrador", "ADMINISTRADOR", "ALMACENERO"] },
      { id: "salidas", label: "Registrar Salida", icon: ArrowUpCircle, path: "/salidas",
        allowedRoles: ["Administrador", "ADMINISTRADOR", "ALMACENERO", "VENDEDOR"] },
    ],
  },
  {
    label: "Configuración",
    items: [
      { id: "administrar-categorias", label: "Categorías", icon: FolderOpen, path: "/administrar-categorias",
        allowedRoles: ["Administrador", "ADMINISTRADOR"] },
      { id: "administrar-proveedores", label: "Proveedores", icon: Truck, path: "/administrar-proveedores",
        allowedRoles: ["Administrador", "ADMINISTRADOR"] },
      { id: "administrar-usuarios", label: "Usuarios", icon: Users, path: "/administrar-usuarios",
        allowedRoles: ["Administrador", "ADMINISTRADOR"] },
    ],
  },
  {
    label: "Análisis",
    items: [
      { id: "movimientos", label: "Movimientos", icon: History, path: "/movimientos",
        allowedRoles: ["Administrador", "ADMINISTRADOR", "SUPERVISOR", "ALMACENERO", "VENDEDOR"] },
      { id: "reportes", label: "Reportes", icon: BarChart3, path: "/reportes",
        allowedRoles: ["Administrador", "ADMINISTRADOR", "SUPERVISOR"] },
      { id: "revision-inventario", label: "Revisión Inventario", icon: TableOfContents, path: "/revision-inventario",
        allowedRoles: ["Administrador", "ADMINISTRADOR", "SUPERVISOR"] },
      { id: "auditoria", label: "Auditoría", icon: Shield, path: "/auditoria",
        allowedRoles: ["Administrador", "ADMINISTRADOR"] },
    ],
  },
];

// specialItem (Mi Plan) removido

const Sidebar = ({ activeSection }: SidebarProps) => {
  const navigate = useNavigate();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const [userRole, setUserRole] = useState<string>("");
  const [suscripcionEstado, setSuscripcionEstado] = useState<string>("");

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUserRole(user.rol || "");
      } catch (e) {
        console.error("Error leyendo usuario del storage");
      }
    }
  }, []);

  // Fetch subscription state for badge
  useEffect(() => {
    const fetchSuscripcion = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiBase}/api/v1/suscripcion/estado`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setSuscripcionEstado(data.estadoSuscripcion || "");
        }
      } catch {
        // Silently fail
      }
    };
    fetchSuscripcion();
  }, []);

  const isAllowed = (allowedRoles: string[]) => {
    if (!userRole) return false;
    return allowedRoles.some((r) => r.toLowerCase() === userRole.toLowerCase());
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : null;
  const username = currentUser?.username || "Usuario";
  const role = currentUser?.rol || "";
  const initials = username.slice(0, 2).toUpperCase();

  const getRoleBadgeColor = (rol: string) => {
    const upper = rol.toUpperCase();
    if (upper === "ADMINISTRADOR" || upper === "ADMIN") return "bg-[#F97316]/15 text-[#F97316]";
    if (upper === "ALMACENERO" || upper === "VENDEDOR") return "bg-[#3B82F6]/15 text-[#3B82F6]";
    if (upper === "SUPERVISOR") return "bg-[#10B981]/15 text-[#10B981]";
    return "bg-white/10 text-white/60";
  };

  const nombreEmpresa = localStorage.getItem("fastory-empresa") || "Mi Bodega";

  const getSuscripcionBadge = () => {
    const upper = suscripcionEstado?.estadoSuscripcion?.toUpperCase() || "";
    if (upper === "PRUEBA" || upper === "TRIAL") return "PRUEBA";
    if (upper === "ACTIVO" || upper === "ACTIVE") return "ACTIVO";
    if (upper === "VENCIDO") return "VENCIDO";
    return "";
  };

  const NavItem = ({ item, onClick }: { item: any; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    const badge = ""; // Badge logic for suscripcion removed

    return (
      <Link
        to={item.path}
        onClick={onClick}
        title={collapsed ? item.label : undefined}
        className={`
          group relative flex items-center gap-3 rounded-[10px] transition-all duration-200 font-medium text-[14px]
          ${collapsed ? "justify-center px-0 py-2.5 mx-1" : "px-4 py-2.5"}
          ${isActive
            ? "bg-[rgba(249,115,22,0.15)] text-[#F97316]"
            : "text-[#6B7280] dark:text-white/60 hover:bg-[rgba(249,115,22,0.08)] hover:text-[#374151] dark:hover:text-white/90"
          }
        `}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#F97316] rounded-r-full" />
        )}

        <Icon className="w-[18px] h-[18px] shrink-0" />

        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F97316]/15 text-[#F97316] uppercase tracking-wide">
                {badge}
              </span>
            )}
          </>
        )}

        {/* Tooltip for collapsed mode */}
        {collapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 text-xs font-medium text-white bg-[#111827] dark:bg-[#1F2937] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
            {item.label}
            {badge && <span className="ml-1.5 text-[#F97316]">({badge})</span>}
          </div>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center shrink-0 ${collapsed && !isMobile ? "justify-center px-2 py-5" : "px-5 py-5"}`}>
        {collapsed && !isMobile ? (
          <img src="/logo.png" alt="Fastory" className="h-9 w-auto" />
        ) : (
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Fastory" className="h-9 w-auto" />
            <div>
              <h1 className="text-[18px] font-[800] text-[#F97316] tracking-tight lowercase leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                fastory
              </h1>
              <p className="text-[11px] text-[#6B7280] dark:text-white/40 font-medium leading-tight">
                Gestión de Inventario
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#E5E7EB] dark:via-[#1F2937] to-transparent mx-4 mb-3" />

      {/* Menu label */}
      {(!collapsed || isMobile) && (
        <h2 className="text-[10px] font-semibold text-[#9CA3AF] dark:text-white/30 uppercase tracking-[0.15em] mb-2 px-5">
          Menú Principal
        </h2>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 [&::-webkit-scrollbar]:hidden">
        {menuGroups.map((group, gi) => {
          const visibleItems = group.items.filter((item) => isAllowed(item.allowedRoles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gi}>
              {gi > 0 && (
                <div className={`my-3 ${collapsed && !isMobile ? "mx-1" : "mx-2"}`}>
                  {(!collapsed || isMobile) ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1F2937]" />
                      <span className="text-[9px] font-semibold text-[#9CA3AF] dark:text-white/25 uppercase tracking-widest">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#1F2937]" />
                    </div>
                  ) : (
                    <div className="h-px bg-[#E5E7EB] dark:bg-[#1F2937]" />
                  )}
                </div>
              )}
              {visibleItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  onClick={isMobile ? () => setMobileOpen(false) : undefined}
                />
              ))}
            </div>
          );
        })}

      </nav>

      {/* Footer — User Profile */}
      <div className="shrink-0 border-t border-[#E5E7EB] dark:border-[#1F2937] p-3">
        {collapsed && !isMobile ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-white cursor-default group relative"
              title={`${nombreEmpresa} · ${role} · ${suscripcionEstado?.estadoSuscripcion || 'ACTIVO'}`}
            >
              <div className="relative">
                <Building2 className="w-4 h-4" />
                <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1F2937] ${suscripcionEstado?.estadoSuscripcion === 'VENCIDO' ? 'bg-red-500' : 'bg-[#10B981]'}`} />
              </div>
              <div className="absolute left-full ml-3 px-2.5 py-1.5 text-xs font-medium text-white bg-[#111827] dark:bg-[#1F2937] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                {nombreEmpresa} · {role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-[10px] text-white bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] shadow-[0_4px_15px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] transition-all duration-300 group relative"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              <div className="absolute left-full ml-3 px-2.5 py-1.5 text-xs font-medium text-white bg-[#111827] dark:bg-[#1F2937] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                Cerrar sesión
              </div>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-white shrink-0 relative">
                <Building2 className="w-4 h-4" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0A0F1E] ${suscripcionEstado?.estadoSuscripcion === 'VENCIDO' ? 'bg-red-500' : 'bg-[#10B981]'}`} title={suscripcionEstado?.estadoSuscripcion || 'ACTIVO'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#111827] dark:text-white truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {nombreEmpresa}
                </p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getRoleBadgeColor(role)}`}>
                  {role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-white bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] shadow-[0_4px_15px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] transition-all duration-300 group/logout"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover/logout:-translate-x-1" />
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay & Drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 z-50 h-full w-72
          bg-white dark:bg-[#0A0F1E] border-r border-[#E5E7EB] dark:border-[#1F2937]
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#6B7280] dark:text-white/60 hover:bg-[#F3F4F6] dark:hover:bg-white/10 z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent isMobile={true} />
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] shadow-lg text-[#6B7280] dark:text-white/70 hover:text-[#F97316] transition-colors"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col shrink-0 h-screen sticky top-0
          bg-white dark:bg-[#0A0F1E] border-r border-[#E5E7EB] dark:border-[#1F2937]
          shadow-sm dark:shadow-none sidebar-transition relative
          ${collapsed ? "w-[72px]" : "w-[260px]"}
        `}
      >
        <SidebarContent />

        {/* Toggle button on edge */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] shadow-md flex items-center justify-center text-[#6B7280] dark:text-white/60 hover:text-[#F97316] hover:border-[#F97316]/50 transition-all duration-200 z-10"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;