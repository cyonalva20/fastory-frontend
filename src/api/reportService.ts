import { apiRequest } from "./apiClient";

export interface ProductoMasVendido {
    nombreProducto: string;
    categoria: string;
    cantidadVendida: number;
}

export interface ProductoBajaRotacion {
    nombreProducto: string;
    stockActual: number;
    cantidadVendida: number;
}

export interface EntradaProveedor {
    nombreProducto: string;
    codigoLote: string;
    cantidadRecibida: number;
    fechaEntrada: string;
}

export const ReportService = {
    // Reporte de Inventario Actual (Reutiliza lógica existente pero centralizada si quieres)
    // Nota: Este ya lo manejas en ProductService, lo dejamos ahí o aquí.

    // Productos más vendidos
    getTopSelling: async (desde: string, hasta: string): Promise<ProductoMasVendido[]> => {
        return apiRequest<ProductoMasVendido[]>(`/api/v1/reportes/mas-vendidos?desde=${desde}&hasta=${hasta}`);
    },

    // Baja rotación
    getLowRotation: async (desde: string, hasta: string, umbral: number): Promise<ProductoBajaRotacion[]> => {
        return apiRequest<ProductoBajaRotacion[]>(`/api/v1/reportes/baja-rotacion?desde=${desde}&hasta=${hasta}&umbral=${umbral}`);
    },

    // Entradas por proveedor
    getSupplierEntries: async (idProveedor: number, desde: string, hasta: string): Promise<EntradaProveedor[]> => {
        return apiRequest<EntradaProveedor[]>(`/api/v1/reportes/entradas-proveedor?idProveedor=${idProveedor}&desde=${desde}&hasta=${hasta}`);
    }
};