import { apiRequest } from "./apiClient";

// --- Interfaces (Tipos) ---

// Corresponde a ProductoBusquedaDto
export interface ProductoBusqueda {
  idProducto: number;
  nombreProducto: string;
  descripcionProducto: string;
  stock: number;
  precioVenta: number;
  perecible?: boolean;
}

// Corresponde a DetalleSalidaDto
export interface DetalleSalida {
  idProducto: number;
  cantidad: number;
}

// Corresponde a RegistroSalidaDto
export interface RegistroSalidaPayload {
  motivo: string;
  observacion?: string;
  detalles: DetalleSalida[];
}

// Corresponde a DetalleHistorialDto
export interface DetalleHistorialSalida {
  nombreProducto: string;
  cantidad: number;
  precioVenta: number;
  subtotal: number;
}

// Corresponde a MovimientoHistorialDto
export interface MovimientoHistorialSalida {
  idMovimiento: number;
  motivo: string;
  fechaMovimiento: string; // LocalDateTime se serializa como String
  nombreUsuario: string;
  detalles: DetalleHistorialSalida[];
  totalGeneral: number;
}

// --- ENTRADAS

/**
 * Representa un producto filtrado por proveedor.
 * (Backend: ProductoPorProveedorDto)
 */
export interface ProductoPorProveedorDto {
  idProducto: number;
  nombreProducto: string;
  esPerecible: boolean;
}

/**
 * Detalle individual en el historial de movimientos.
 * (Backend: DetalleHistorialDto)
 */
export interface DetalleHistorialDto {
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioVenta: number;
  precioCompra: number;
  subtotal: number;
  // --- NUEVOS CAMPOS ---
  stockAnterior?: number; // Puede ser opcional si movimientos viejos no lo tienen
  stockNuevo?: number;
}

/**
 * Un registro en el historial de movimientos.
 * (Backend: MovimientoHistorialDto)
 */
export interface MovimientoHistorialDto {
  idMovimiento: number;
  motivo: string;
  tipoMovimiento: string; // "ENTRADA" | "SALIDA"
  fechaMovimiento: string;
  nombreUsuario: string;
  idUsuario: number;
  detalles: DetalleHistorialDto[];
  totalGeneral: number;
}

// --- DTOs de PAYLOAD (lo que enviamos) ---

/**
 * Detalle de un producto en el payload de registro de entrada.
 * (Backend: DetalleEntradaDto)
 */
export interface DetalleEntradaDto {
  idProducto: number;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  fechaVencimiento?: string | null; // ISO DateTime string
  observacionDetalle?: string;
}
// --- NUEVO: Payload para Ajuste ---
export interface AjusteInventarioPayload {
    idProducto: number;
    stockReal: number;
}
/**
 * Payload principal para registrar una entrada.
 * (Backend: RegistroEntradaDto)
 */
export interface RegistroEntradaDto {
  idProveedor: number;
  fechaEntrada?: string; // ISO DateTime string (Opcional, el backend pone NOW si es nulo)
  detalles: DetalleEntradaDto[];
}
// --- Servicio ---
export interface MovimientoUpdatePayload {
  tipoMovimiento: string;
  idResponsable: number;
  fecha: string; // "YYYY-MM-DD"
  hora: string; // "HH:mm"
  detalles: {
    idProducto: number;
    cantidad: number;
  }[];
}

export const MovimientoService = {
  /**
   * Busca productos por nombre para el autocompletado.
   * GET /api/v1/movimientos/productos/buscar?nombre=...
   */
  buscarProductos: (nombre: string): Promise<ProductoBusqueda[]> => {
    // AHORA es 'permitAll' en tu SecurityConfig
    return apiRequest<ProductoBusqueda[]>(
      `/api/v1/movimientos/productos/buscar?nombre=${encodeURIComponent(
        nombre
      )}`,
      {
        method: "GET",
      }
    );
  },

  /**
   * Registra una nueva salida de inventario.
   * POST /api/v1/movimientos/salidas
   */
  registrarSalida: (
    payload: RegistroSalidaPayload
  ): Promise<{ message: string }> => {
    const token = localStorage.getItem("token"); // Aunque es 'permitAll', es buena práctica enviarlo
    return apiRequest(`/api/v1/movimientos/salidas`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  },

  /**
   * Obtiene el historial de salidas.
   * GET /api/v1/movimientos/salidas/historial
   */
  obtenerHistorialSalidas: (): Promise<MovimientoHistorialSalida[]> => {
    const token = localStorage.getItem("token"); // Aunque es 'permitAll', es buena práctica enviarlo
    return apiRequest<MovimientoHistorialSalida[]>(
      "/api/v1/movimientos/salidas/historial",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  /**
   * Obtiene los productos asociados a un proveedor específico.
   * GET /api/v1/movimientos/productos/proveedor/{idProveedor}
   */
  getProductosPorProveedor: (
    idProveedor: number
  ): Promise<ProductoPorProveedorDto[]> => {
    return apiRequest<ProductoPorProveedorDto[]>(
      `/api/v1/movimientos/productos/proveedor/${idProveedor}`
    );
  },

  /**
   * Registra una nueva entrada de inventario.
   * POST /api/v1/movimientos/entradas
   */
  registrarEntrada: (
    payload: RegistroEntradaDto
  ): Promise<{ message: string }> => {
    return apiRequest(`/api/v1/movimientos/entradas`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Obtiene el historial de todas las entradas.
   * GET /api/v1/movimientos/entradas/historial
   */
  getHistorialEntradas: (): Promise<MovimientoHistorialDto[]> => {
    return apiRequest<MovimientoHistorialDto[]>(
      "/api/v1/movimientos/entradas/historial"
    );
  },

  
 /**
   * Lista movimientos con filtros
   */
  listarMovimientos: (fechaInicio?: string, fechaFin?: string, tipo?: string): Promise<MovimientoHistorialDto[]> => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append("fechaInicio", fechaInicio);
    if (fechaFin) params.append("fechaFin", fechaFin);
    if (tipo && tipo !== "todos") params.append("tipo", tipo);

    return apiRequest<MovimientoHistorialDto[]>(`/api/v1/movimientos?${params.toString()}`, {
      method: "GET",
    });
  },

  /**
   * Actualizar movimiento
   */
  actualizarMovimiento: (id: number, payload: MovimientoUpdatePayload): Promise<{ message: string }> => {
    return apiRequest(`/api/v1/movimientos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Eliminar movimiento
   */
  eliminarMovimiento: (id: number): Promise<{ message: string }> => {
    return apiRequest(`/api/v1/movimientos/${id}`, {
      method: "DELETE",
    });
  },

  // --- NUEVOS MÉTODOS DE AJUSTE ---
  registrarAjuste: (payload: AjusteInventarioPayload): Promise<{ message: string }> => {
    return apiRequest(`/api/v1/movimientos/ajustes`, {
        method: "POST",
        body: JSON.stringify(payload)
    });
  },

  obtenerHistorialAjustes: (): Promise<MovimientoHistorialDto[]> => {
      return apiRequest<MovimientoHistorialDto[]>("/api/v1/movimientos/ajustes/historial");
  },

};
