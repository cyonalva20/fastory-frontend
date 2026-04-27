import { apiRequest } from "./apiClient";

// --- Interfaces ---

export interface AuditoriaDto {
  idAuditoria: number;
  idEmpresa: number;
  idUsuario: number;
  tablaAfectada: string;
  idRegistro: number;
  accion: string;
  datosAnteriores: string | null; // JSON string
  datosNuevos: string | null; // JSON string
  fechaAuditoria: string; // ISO DateTime
}

// --- Servicio ---

export const AuditoriaService = {
  /**
   * Obtiene todos los registros de auditoría de la empresa.
   * GET /api/v1/auditoria
   */
  obtenerTodas: (): Promise<AuditoriaDto[]> => {
    return apiRequest<AuditoriaDto[]>("/api/v1/auditoria", { method: "GET" });
  },

  /**
   * Filtra registros de auditoría por usuario.
   * GET /api/v1/auditoria/usuario/{idUsuario}
   */
  obtenerPorUsuario: (idUsuario: number): Promise<AuditoriaDto[]> => {
    return apiRequest<AuditoriaDto[]>(`/api/v1/auditoria/usuario/${idUsuario}`, {
      method: "GET",
    });
  },

  /**
   * Filtra registros de auditoría por tabla afectada.
   * GET /api/v1/auditoria/tabla/{tabla}
   */
  obtenerPorTabla: (tabla: string): Promise<AuditoriaDto[]> => {
    return apiRequest<AuditoriaDto[]>(
      `/api/v1/auditoria/tabla/${encodeURIComponent(tabla)}`,
      { method: "GET" }
    );
  },
};
