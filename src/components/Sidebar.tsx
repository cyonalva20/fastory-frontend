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
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

interface SidebarProps {
  activeSection?: string;
}

const Sidebar = ({ activeSection }: SidebarProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

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

  // Definir items y sus roles permitidos
  // Si allowedRoles está vacío o undefined, es accesible para todos los autenticados
  const allMenuItems = [
    {
      id: "panel-principal",
      label: "Panel Principal",
      icon: Home,
      path: "/",
      allowedRoles: ["Administrador", "ADMINISTRADOR", "SUPERVISOR", "ALMACENERO", "VENDEDOR"],
    },
    {
      id: "nuevo-producto",
      label: "Nuevo producto",
      icon: PackagePlus,
      path: "/nuevo-producto",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "salidas",
      label: "Registrar Salida",
      icon: ArrowUpCircle,
      path: "/salidas",
      allowedRoles: ["Administrador", "ADMINISTRADOR", "ALMACENERO", "VENDEDOR"],
    },
    {
      id: "entradas",
      label: "Registrar Entrada",
      icon: ArrowDownCircle,
      path: "/entradas",
      allowedRoles: ["Administrador", "ADMINISTRADOR", "ALMACENERO"],
    },
    {
      id: "administrar-categorias",
      label: "Administrar Categorías",
      icon: FolderOpen,
      path: "/administrar-categorias",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "administrar-proveedores",
      label: "Administrar Proveedores",
      icon: Users,
      path: "/administrar-proveedores",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
    {
      id: "movimientos",
      label: "Movimientos",
      icon: History,
      path: "/movimientos",
      allowedRoles: ["Administrador", "ADMINISTRADOR", "SUPERVISOR", "ALMACENERO", "VENDEDOR"],
    },
    {
      id: "reportes",
      label: "Reportes",
      icon: BarChart3,
      path: "/reportes",
      allowedRoles: ["Administrador", "ADMINISTRADOR", "SUPERVISOR"],
    },
    {
      id: "revision-inventario",
      label: "Revision Inventario",
      icon: TableOfContents,
      path: "/revision-inventario",
      allowedRoles: ["Administrador", "ADMINISTRADOR", "SUPERVISOR"],
    },
    {
      id: "administrar-usuarios",
      label: "Administrar Usuarios",
      icon: Users,
      path: "/administrar-usuarios",
      allowedRoles: ["Administrador", "ADMINISTRADOR"],
    },
  ];

  // Filtrar menú basado en el rol
  const menuItems = allMenuItems.filter((item) => {
    if (!userRole) return false; // Si no hay rol cargado aún, no mostrar nada por seguridad visual
    // Normalizar comparación
    return item.allowedRoles.some(
      (r) => r.toLowerCase() === userRole.toLowerCase()
    );
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const MenuContent = () => (
    <div className="p-5 space-y-1 h-full flex flex-col">
      {/* Brand */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-outfit font-bold text-foreground tracking-tight">Fastory</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Gestión de Inventario</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-3" />

      <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-2 px-3">
        Menú Principal
      </h2>

      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          const ButtonContent = (
            <>
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
            </>
          );

          return (
            <Link key={item.id} to={item.path} onClick={() => setOpen(false)}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-10 text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/10 hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                {ButtonContent}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="pt-3 border-t border-border/40">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 h-10 text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <span className="flex-1 text-left">Cerrar sesión</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-card/90 backdrop-blur-md border border-border/50 shadow-lg hover:bg-card hover:shadow-primary/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-card border-r-border/30">
            <MenuContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-card/95 backdrop-blur-xl border-r border-border/40 min-h-screen">
        <MenuContent />
      </aside>
    </>
  );
};

export default Sidebar;