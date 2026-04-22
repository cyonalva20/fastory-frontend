import { apiRequest } from "./apiClient";

export interface UserDto {
  idUsuario: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  nombreRol: string;
  idRol: number;
  fechaIngreso: string;
  estado: boolean;
}

export interface UserPayload {
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password?: string; // Opcional en update
  idRol: number;
}

export const UserService = {
  list: async (): Promise<UserDto[]> => {
    return apiRequest<UserDto[]>("/api/v1/usuarios", { method: "GET" });
  },

  create: async (payload: UserPayload): Promise<UserDto> => {
    return apiRequest<UserDto>("/api/v1/usuarios", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update: async (id: number, payload: UserPayload): Promise<UserDto> => {
    return apiRequest<UserDto>(`/api/v1/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/api/v1/usuarios/${id}`, {
      method: "DELETE",
    });
  },
};
