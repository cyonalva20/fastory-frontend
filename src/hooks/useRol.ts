import { AuthService } from "@/api/authService";

export const useRol = () => {
  const user = AuthService.getCurrentUser();
  const rol = user?.rol?.toUpperCase() || "";

  return {
    rol,
    isAdmin: rol === "ADMINISTRADOR" || rol === "ADMIN",
    isSupervisor: rol === "SUPERVISOR",
    isAlmacenero: rol === "ALMACENERO" || rol === "VENDEDOR",
    isReadOnly: rol === "SUPERVISOR"
  };
};
