import { apiRequest } from "./apiClient";

// Interfaces que coinciden con tus DTOs del Backend
export interface RepisaDetalle {
  idRepisa: number;
  codigo: string;
  numeroFilas: number;
  numeroColumnas: number;
}

export interface UbicacionDto {
  idUbicacion: number;
  idRepisa: number;
  fila: number;
  columna: number;
  estado: "LIBRE" | "OCUPADA";
}

export interface RepisaCreatePayload {
  codigo: string;
  descripcion?: string;
  numeroFilas: number;
  numeroColumnas: number;
}

// Este payload no se usará en el flujo de NUEVO producto, pero es útil para la gestión.
export interface AsignarUbicacionPayload {
  productoId: number;
  repisaId: number;
  fila: number;
  columna: number;
}

export const UbicacionService = {
  // GET /api/v1/ubicaciones/repisas
  listarRepisas: (): Promise<RepisaDetalle[]> => {
    return apiRequest<RepisaDetalle[]>("/api/v1/ubicaciones/repisas");
  },

  // GET /api/v1/ubicaciones/repisas/{id}/detalle
  obtenerDetalleRepisa: (idRepisa: number): Promise<UbicacionDto[]> => {
    return apiRequest<UbicacionDto[]>(
      `/api/v1/ubicaciones/repisas/${idRepisa}/detalle`
    );
  },

  // POST /api/v1/ubicaciones/repisas
  crearRepisa: (payload: RepisaCreatePayload): Promise<{ message: string }> => {
    return apiRequest(`/api/v1/ubicaciones/repisas`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // POST /api/v1/ubicaciones/asignar (Para gestionar ubicaciones de productos existentes)
  asignarProductoExistente: (
    payload: AsignarUbicacionPayload
  ): Promise<UbicacionDto> => {
    return apiRequest(`/api/v1/ubicaciones/asignar`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
