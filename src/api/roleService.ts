import { apiRequest } from "./apiClient";

export interface Rol {
  idRol: number;
  nombreRol: string;
  descripcion: string;
}

export const RoleService = {
  list: async (): Promise<Rol[]> => {
    return apiRequest<Rol[]>("/api/v1/roles", { method: "GET" });
  },
};
