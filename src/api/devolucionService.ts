import { apiRequest } from "./apiClient";

// Coincide con Java: DevolucionCreateDto
export interface DevolucionCreatePayload {
  idProducto: number;
  idLote: number; // El backend requiere el ID, no el código
  cantidad: number;
  idProveedor: number;
  motivo?: string;
  fechaEntrega?: string; // YYYY-MM-DD
}

// Coincide con Java: DevolucionListDto
export interface DevolucionPendiente {
  idDevolucion: number;
  nombreProducto: string;  // String plano
  codigoLote: string;      // String plano
  cantidad: number;
  nombreProveedor: string; // String plano
  fechaRecepcion: string;  // String ya formateado desde el backend
  estado: string;
}

export const DevolucionService = {
  create: (payload: DevolucionCreatePayload): Promise<{ message: string }> => {
    return apiRequest("/api/v1/devoluciones", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listarPendientes: (): Promise<DevolucionPendiente[]> => {
    return apiRequest<DevolucionPendiente[]>("/api/v1/devoluciones/pendientes", {
        method: "GET"
    });
  },
};