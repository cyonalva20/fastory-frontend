import { apiRequest } from "./apiClient";

export interface ProductPayload {
  nombreProducto: string;
  precioCompra: number;
  precioVenta: number;
  unidadMedida: string;
  idCategoria: number;
  idProveedor: number;
  stock: number;
  stockMinimo: number;
  fechaVencimiento?: string | null;
  perecible: boolean;
  marca?: string;
  descripcion?: string;
  idUbicacion: number;
}

// --- ACTUALIZADO CON MARCA Y UBICACIÓN ---
export interface ProductoUpdatePayload {
  nombreProducto: string;
  descripcion?: string;
  marca?: string; // AÑADIDO
  idCategoria: number;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
  // Ubicación (todos opcionales, se envían juntos o ninguno)
  idRepisa?: number; // AÑADIDO
  fila?: number; // AÑADIDO
  columna?: number; // AÑADIDO
  forzarCambioUbicacion?: boolean; // AÑADIDO - Flag para desasignar ubicación del producto anterior
}

export interface ProductoInventario {
  idProducto: number;
  nombre: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stockDisponible: number;
  stockMinimo: number;
  ubicacion: string;
  proveedor: string;
}

export interface LoteDetalle {
  idLote: number;
  codigoLote: string;
  cantidad: number;
  fechaVencimiento: string | null;
}

// --- ACTUALIZADO CON CAMPOS DE UBICACIÓN DETALLADA ---
export interface ProductoDetalle {
  idProducto: number;
  nombre: string;
  categoria: string;
  idCategoria: number;
  marca: string;
  descripcion: string;
  precioCompra: number;
  precioVenta: number;
  stockDisponible: number;
  stockMinimo: number;
  ubicacion: string; // Formato "A-1-2"
  // Campos detallados de ubicación
  idUbicacion?: number; // AÑADIDO
  idRepisa?: number; // AÑADIDO
  fila?: number; // AÑADIDO
  columna?: number; // AÑADIDO
  perecible: boolean;
  fechaVencimientoProxima: string | null;
  proveedor: string;
  lotes: LoteDetalle[];
}

export interface CategoriaFiltro {
  idCategoria: number;
  nombreCategoria: string;
  descripcion: string;
  cantidadProductos: number;
}

export interface RepisaFiltro {
  idRepisa: number;
  codigo: string;
  numeroFilas: number;
  numeroColumnas: number;
}

export interface FiltrosData {
  categorias: CategoriaFiltro[];
  repisas: RepisaFiltro[];
}

export interface InventarioParams {
  nombre?: string;
  categoriaId?: number;
  repisa?: string;
  fila?: number;
  columna?: number;
  sortBy?: string;
  sortDir?: string;
}

// --- NUEVA INTERFAZ PARA UBICACIONES ---
export interface UbicacionDto {
  idUbicacion: number;
  idRepisa: number;
  fila: number;
  columna: number;
  estado: string; // "LIBRE" o "OCUPADA"
}

const buildQueryString = (params: Record<string, any>): string => {
  const query = Object.entries(params)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
  return query ? `?${query}` : "";
};

export const ProductService = {
  create: (payload: ProductPayload): Promise<string> => {
    return apiRequest<string>("/api/productos/registrar", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getInventario: (params: InventarioParams): Promise<ProductoInventario[]> => {
    const queryString = buildQueryString(params);
    return apiRequest<ProductoInventario[]>(
      `/api/productos/inventario${queryString}`
    );
  },

  getFiltrosInventario: (): Promise<FiltrosData> => {
    return apiRequest<FiltrosData>("/api/productos/filtros");
  },

  getProductoDetalle: (id: number): Promise<ProductoDetalle> => {
    return apiRequest<ProductoDetalle>(`/api/productos/detalles/${id}`);
  },

  updateProducto: (
    id: number,
    payload: ProductoUpdatePayload
  ): Promise<ProductoDetalle> => {
    const token = localStorage.getItem("token");
    return apiRequest<ProductoDetalle>(`/api/productos/actualizar/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  },

  // --- NUEVA FUNCIÓN PARA OBTENER UBICACIONES DE UNA REPISA ---
  getUbicacionesPorRepisa: (repisaId: number): Promise<UbicacionDto[]> => {
    return apiRequest<UbicacionDto[]>(
      `/api/v1/ubicaciones/repisas/${repisaId}/detalle`
    );
  },

  // --- NUEVA FUNCIÓN PARA ALERTAS DE STOCK ---
  getAlertasStock: (): Promise<ProductoInventario[]> => {
    return apiRequest<ProductoInventario[]>("/api/productos/alertas");
  },
};
