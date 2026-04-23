import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/api/apiClient";
import { AuthService } from "@/api/authService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface SuscripcionEstado {
  estadoSuscripcion: string;
  fechaVencimiento: string | null;
  diasRestantes: number;
  mensaje: string;
}

const SubscriptionPanel = () => {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<SuscripcionEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renovando, setRenovando] = useState(false);

  const user = AuthService.getCurrentUser();
  const isAdmin = user?.rol?.toUpperCase() === "ADMINISTRADOR";

  const fetchEstado = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<SuscripcionEstado>("/api/v1/suscripcion/estado", {
        method: "GET",
      });
      setEstado(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar la suscripción");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstado();
  }, []);

  const handleRenovar = async () => {
    try {
      setRenovando(true);
      const data = await apiRequest<SuscripcionEstado>("/api/v1/suscripcion/renovar", {
        method: "POST",
      });
      setEstado(data);
      toast.success("¡Suscripción renovada exitosamente!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al intentar renovar");
    } finally {
      setRenovando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-10">
        <h2>Cargando estado de la suscripción...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-10 text-red-500 font-bold">
        <p>{error}</p>
        <Button onClick={fetchEstado} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  if (!estado) return null;

  const isVencido = estado.estadoSuscripcion === "VENCIDO";

  return (
    <div className="p-8 max-w-2xl mx-auto mt-10 border rounded shadow-sm bg-card text-card-foreground">
      <h1 className="text-2xl font-bold mb-6">Estado de la Suscripción</h1>
      
      {isVencido && (
        <div className="bg-red-100 text-red-800 p-4 mb-6 rounded border border-red-300">
          <strong>¡Alerta Crítica!</strong> Su acceso ha sido bloqueado porque la suscripción se encuentra vencida.
          No podrá utilizar ningún módulo del sistema hasta que renueve su plan.
        </div>
      )}

      <div className="space-y-4 text-lg">
        <p>
          <strong>Estado actual: </strong> 
          <span className={`font-bold ${isVencido ? 'text-red-600' : 'text-green-600'}`}>
            {estado.estadoSuscripcion}
          </span>
        </p>

        <p>
          <strong>Días restantes: </strong> 
          {estado.diasRestantes} días
        </p>

        <p>
          <strong>Fecha de vencimiento: </strong> 
          {estado.fechaVencimiento ? format(parseISO(estado.fechaVencimiento), "dd/MM/yyyy HH:mm") : "N/A"}
        </p>

        <p className="bg-muted p-3 rounded text-sm mt-4">
          <em>"{estado.mensaje}"</em>
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        {isAdmin && (
          <Button 
            onClick={handleRenovar} 
            disabled={renovando}
            variant={isVencido ? "destructive" : "default"}
          >
            {renovando ? "Procesando pago..." : "Renovar Suscripción"}
          </Button>
        )}
        
        {!isVencido && (
          <Button variant="outline" onClick={() => navigate("/")}>
            Ir al Dashboard
          </Button>
        )}

        {!isAdmin && isVencido && (
          <p className="text-red-500 font-bold text-sm">
            Contacte a su administrador para renovar el sistema.
          </p>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPanel;
