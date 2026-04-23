import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import NewProduct from "./pages/NewProduct";
import ManageCategories from "./pages/ManageCategories";
import ManageProveedores from "./pages/ManageProveedores";
import RegisterSalesOutput from "./pages/RegisterSalesOutput";
import RegisterSupplierInput from "./pages/RegisterSupplierInput";
import InventoryReport from "./pages/InventoryReport";
import InventoryReview from "./pages/InventoryReview";
import Movements from "./pages/Movements";
import ManageUsers from "./pages/ManageUsers";
import CurrentInventoryReport from "./pages/CurrentInventoryReport";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SubscriptionPanel from "./pages/SubscriptionPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* --- RUTA PÚBLICA --- */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* --- RUTAS PROTEGIDAS (Requieren Login) --- */}
          
          {/* Nivel 1: Acceso Universal (Admin, Vendedor, Supervisor, Almacenero) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />} /> {/* Panel Principal */}
            <Route path="/suscripcion" element={<SubscriptionPanel />} />
          </Route>

          {/* Módulos Operativos (Admin, Almacenero, Vendedor) */}
          <Route element={<ProtectedRoute allowedRoles={["Administrador", "ADMINISTRADOR", "ALMACENERO", "VENDEDOR", "SUPERVISOR"]} />}>
            <Route path="/salidas" element={<RegisterSalesOutput />} />
            <Route path="/entradas" element={<RegisterSupplierInput />} />
            <Route path="/movimientos" element={<Movements />} />
          </Route>

          {/* Módulos Analíticos (Admin, Supervisor) */}
          <Route element={<ProtectedRoute allowedRoles={["Administrador", "ADMINISTRADOR", "SUPERVISOR"]} />}>
            <Route path="/reportes" element={<InventoryReport />} />
            <Route path="/reporte-inventario-actual" element={<CurrentInventoryReport />} />
            <Route path="/revision-inventario" element={<InventoryReview />} />
          </Route>

          {/* Módulos Administrativos y Configuración (Solo Administrador) */}
          <Route element={<ProtectedRoute allowedRoles={["Administrador", "ADMINISTRADOR"]} />}>
            <Route path="/nuevo-producto" element={<NewProduct />} />
            <Route path="/administrar-categorias" element={<ManageCategories />} />
            <Route path="/administrar-proveedores" element={<ManageProveedores />} />
            <Route path="/administrar-usuarios" element={<ManageUsers />} />
          </Route>

          {/* Ruta por defecto para URLs no encontradas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
