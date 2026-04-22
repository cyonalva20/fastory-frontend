import { apiRequest } from "./apiClient";

/**
 * DTO que llega desde el backend con todos los detalles de la categoría.
 */
export interface CategoriaDetalle {
  idCategoria: number;
  nombreCategoria: string;
  descripcion: string;
  cantidadProductos: number;
}

/**
 * Payload para crear o actualizar una categoría.
 */
export interface CategoriaPayload {
  nombreCategoria: string;
  descripcion?: string;
}

export const CategoryService = {
  /**
   * Obtiene la lista simple de categorías para los menús desplegables.
   * FIX: Se cambió al endpoint /con-conteo que es más estable y devuelve un array consistente.
   */
  list: async (): Promise<{ id: number; nombre: string }[]> => {
    // Se usa el endpoint que devuelve CategoriaDto, que es seguro y siempre un array.
    const rawCategories: CategoriaDetalle[] = await apiRequest(
      "/api/v1/categorias/con-conteo"
    );
    return rawCategories.map((cat) => ({
      id: cat.idCategoria,
      nombre: cat.nombreCategoria,
    }));
  },

  /**
   * Obtiene la lista de categorías con el conteo de productos para la página de gestión.
   */
  listWithCount: async (): Promise<CategoriaDetalle[]> => {
    return apiRequest("/api/v1/categorias/con-conteo");
  },

  /**
   * Crea una nueva categoría.
   */
  create: async (payload: CategoriaPayload): Promise<CategoriaDetalle> => {
    return apiRequest(`/api/v1/categorias`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Actualiza una categoría existente.
   */
  update: async (
    id: number,
    payload: CategoriaPayload
  ): Promise<CategoriaDetalle> => {
    return apiRequest(`/api/v1/categorias/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Elimina una categoría.
   */
  delete: async (id: number): Promise<void> => {
    await apiRequest(`/api/v1/categorias/${id}`, {
      method: "DELETE",
    });
  },
};
