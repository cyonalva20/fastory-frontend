import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const userString = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  
  // Parsear usuario de forma segura
  let user = null;
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (e) {
    console.error("Error al leer datos de usuario", e);
    // Si hay error en los datos, forzamos logout limpiando
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  // 1. Si no hay token o usuario, redirigir a Login
  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }

  // 2. Validación de Roles (si se especifican roles permitidos)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.rol || "";
    // Normalizar a minúsculas para comparación flexible
    const hasPermission = allowedRoles.some(
      (role) => role.toLowerCase() === userRole.toLowerCase()
    );

    if (!hasPermission) {
      // Si no tiene permiso, redirigir al Home (Index) por defecto
      return <Navigate to="/" replace />;
    }
  }

  // 3. Si pasa todas las validaciones, renderizar la ruta solicitada
  return <Outlet />;
};

export default ProtectedRoute;