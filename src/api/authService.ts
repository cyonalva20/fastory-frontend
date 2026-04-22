import { apiRequest } from "./apiClient";

export interface AuthResponse {
  token?: string;
  message?: string;
  rol?: string;
  idUsuario?: number;
}

export const AuthService = {
  /**
   * Inicia sesión del usuario
   * IMPORTANTE: Limpia el localStorage antes de hacer login para evitar
   * que tokens antiguos causen problemas (Error 403)
   */
  login: async (username: string, password: string): Promise<AuthResponse> => {
    // 🔸 Limpiar tokens y datos antiguos antes de intentar login
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    try {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // 🔸 Si el login es exitoso y hay un token, guardarlo
      if (response.token) {
        localStorage.setItem("token", response.token);

        // 🔸 Guardar información del usuario si está disponible
        if (response.idUsuario && response.rol) {
          const userData = {
            id: response.idUsuario,
            username: username,
            rol: response.rol,
          };
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }

      return response;
    } catch (error) {
      // 🔸 En caso de error, asegurarse de limpiar localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw error;
    }
  },

  /**
   * Registra un nuevo usuario
   */
  register: async (
    username: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario
   * Limpia todos los datos de autenticación del localStorage
   */
  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  /**
   * Verifica si el usuario está autenticado
   * Retorna true si existe un token válido en localStorage
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("token");
    return token !== null && token !== "";
  },

  /**
   * Obtiene el token actual del localStorage
   */
  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  /**
   * Obtiene la información del usuario actual
   */
  getCurrentUser: (): { id: number; username: string; rol: string } | null => {
    const userString = localStorage.getItem("user");
    if (!userString) return null;

    try {
      return JSON.parse(userString);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  },

  // --- NUEVOS MÉTODOS DE RECUPERACIÓN DE CONTRASEÑA ---

  // Paso 1: Enviar correo con código
  sendRecoveryCode: async (email: string): Promise<{ message: string }> => {
    return apiRequest("/auth/recovery/send-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Paso 2: Verificar código
  verifyRecoveryCode: async (email: string, codigo: string): Promise<{ valid: boolean; message: string }> => {
    return apiRequest("/auth/recovery/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, codigo }),
    });
  },

  // Paso 3: Restablecer contraseña
  resetPassword: async (email: string, codigo: string, newPassword: string): Promise<{ message: string }> => {
    return apiRequest("/auth/recovery/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, codigo, newPassword }),
    });
  },
};
