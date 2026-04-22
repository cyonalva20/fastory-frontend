import { apiRequest } from "./apiClient";

/**
 * DTO que llega desde el backend con todos los detalles de la categoría.
 */
export interface ProveedorDetalle {
  idProveedor: number;
  nombreProveedor: string;
  telefono: string;
  cantidadProductos: number;
}

/**
 * Payload para crear o actualizar una categoría.
 */
export interface ProveedorPayload {
  nombreProveedor: string;
  telefono: string;
}
export interface Proveedor {
  idProveedor: number;
  nombreProveedor: string;
  telefono: string;
}

export const ProveedorService = {
  /**
   * Obtiene la lista simple de categorías para los menús desplegables.
   * FIX: Se cambió al endpoint /con-conteo que es más estable y devuelve un array consistente.
   */
  list: async (): Promise<{ id: number; nombre: string }[]> => {
    // Se usa el endpoint que devuelve CategoriaDto, que es seguro y siempre un array.
    const rawProveedores: ProveedorDetalle[] = await apiRequest(
      "/api/v1/proveedores/con-conteo"
    ); // Asegurar que siempre sea un array
    const data = Array.isArray(rawProveedores) ? rawProveedores : [];
    return data.map((cat) => ({
      id: cat.idProveedor,
      nombre: cat.nombreProveedor,
    }));
  }
  /**
   * Obtiene la lista de categorías con el conteo de productos para la página de gestión.
   */,

  listWithCount: async (): Promise<ProveedorDetalle[]> => {
    const data = await apiRequest<ProveedorDetalle[]>(
      "/api/v1/proveedores/con-conteo"
    );
    // Asegurar que siempre sea un array
    return Array.isArray(data) ? data : [];
  },

  listProveedores: async (): Promise<Proveedor[]> => {
    // Asegúrate de que este endpoint exista en tu backend
    const data = await apiRequest<Proveedor[]>("/api/v1/proveedores");
    // Asegurar que siempre sea un array
    return Array.isArray(data) ? data : [];
  }
  /**
   * Crea una nueva categoría.
   */,

  create: async (payload: ProveedorPayload): Promise<ProveedorDetalle> => {
    return apiRequest(`/api/v1/proveedores`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  /**
   * Actualiza una categoría existente.
   */,

  update: async (
    id: number,
    payload: ProveedorPayload
  ): Promise<ProveedorDetalle> => {
    return apiRequest(`/api/v1/proveedores/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
  /**
   * Elimina una categoría.
   */,

  delete: async (id: number): Promise<void> => {
    await apiRequest(`/api/v1/proveedores/${id}`, {
      method: "DELETE",
    });
  },
};

export default ProveedorService;
