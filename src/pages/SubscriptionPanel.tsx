import React, { useEffect, useState } from "react";
import { apiRequest } from "@/api/apiClient";
import { AuthService } from "@/api/authService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useSidebar } from "@/components/SidebarContext";
import { Check, CreditCard, ChevronLeft } from "lucide-react";

interface SuscripcionEstado {
  estadoSuscripcion: string;
  fechaVencimiento: string | null;
  diasRestantes: number;
  mensaje: string;
}

const SubscriptionPanel = () => {
  const [estado, setEstado] = useState<SuscripcionEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renovando, setRenovando] = useState(false);
  const [showPurchaseCard, setShowPurchaseCard] = useState(false);

  const { refreshSuscripcion } = useSidebar();
  const user = AuthService.getCurrentUser();
  const isAdmin = user?.rol?.toUpperCase() === "ADMINISTRADOR" || user?.rol?.toUpperCase() === "ADMIN";

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

  const handleConfirmarPago = async () => {
    try {
      setRenovando(true);
      const data = await apiRequest<SuscripcionEstado>("/api/v1/suscripcion/renovar", {
        method: "POST",
      });
      setEstado(data);
      setShowPurchaseCard(false);
      refreshSuscripcion(); // Actualizar indicador global
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
      <div className="p-8 max-w-xl mx-auto flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <Button onClick={fetchEstado} variant="outline">Reintentar</Button>
      </div>
    );
  }

  if (!estado) return null;

  const isVencido = estado.estadoSuscripcion === "VENCIDO";

  if (showPurchaseCard) {
    return (
      <div className="p-2 sm:p-6 bg-white dark:bg-[#111827] animate-in fade-in zoom-in-95 duration-300">
        <button 
          onClick={() => setShowPurchaseCard(false)}
          className="flex items-center text-sm text-[#6B7280] dark:text-white/60 hover:text-[#111827] dark:hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Volver al estado
        </button>

        <div className="bg-[#FFFFFF] dark:bg-[#1F2937] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-[#374151] flex flex-col relative overflow-hidden shadow-lg">
          <div className="absolute top-0 inset-x-0 h-1 bg-[#F97316]"></div>
          <div className="absolute top-6 right-6 bg-[#F97316] text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full">
            RENOVACIÓN
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-[#111827] dark:text-white mb-2">Plan Activo</h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl sm:text-5xl font-extrabold text-[#111827] dark:text-white">S/ 11</span>
            <span className="text-[#6B7280] dark:text-gray-400 font-medium">/ mes</span>
          </div>
          
          <ul className="space-y-4 mb-8 flex-1 text-sm sm:text-base">
            <li className="flex items-center text-[#4B5563] dark:text-gray-300">
              <Check className="w-5 h-5 text-[#F97316] mr-3 font-bold shrink-0" /> Acceso completo al sistema
            </li>
            <li className="flex items-center text-[#4B5563] dark:text-gray-300">
              <Check className="w-5 h-5 text-[#F97316] mr-3 font-bold shrink-0" /> Soporte prioritario
            </li>
            <li className="flex items-center text-[#4B5563] dark:text-gray-300">
              <Check className="w-5 h-5 text-[#F97316] mr-3 font-bold shrink-0" /> Respaldo diario de datos
            </li>
            <li className="flex items-center text-[#4B5563] dark:text-gray-300">
              <Check className="w-5 h-5 text-[#F97316] mr-3 font-bold shrink-0" /> Actualizaciones gratuitas
            </li>
          </ul>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={handleConfirmarPago} 
              disabled={renovando}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white py-6 text-lg font-bold shadow-lg shadow-orange-500/20"
            >
              {renovando ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando pago...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Confirmar Pago Seguro
                </span>
              )}
            </Button>
            <p className="text-center text-xs text-gray-500 mt-4">
              Pago seguro y encriptado. Se activará su plan inmediatamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6 bg-card text-card-foreground">
      <h2 className="text-2xl font-bold mb-6 text-[#111827] dark:text-white">Estado de la Suscripción</h2>
      
      {isVencido && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400 p-4 mb-6 rounded-lg border border-red-200 dark:border-red-500/20 shadow-sm">
          <strong className="block mb-1">¡Alerta Crítica!</strong> Su acceso está limitado porque la suscripción se encuentra vencida.
          No podrá utilizar los módulos operativos del sistema hasta que renueve su plan.
        </div>
      )}

      <div className="space-y-4 text-sm sm:text-base text-[#4B5563] dark:text-white/70">
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
          <strong className="text-[#111827] dark:text-white/90">Estado actual: </strong> 
          <span className={`font-bold uppercase px-2.5 py-1 rounded-full text-xs ${isVencido ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
            {estado.estadoSuscripcion}
          </span>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
          <strong className="text-[#111827] dark:text-white/90">Días restantes: </strong> 
          <span className="font-medium">{estado.diasRestantes} días</span>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
          <strong className="text-[#111827] dark:text-white/90">Fecha de vencimiento: </strong> 
          <span>{estado.fechaVencimiento ? format(parseISO(estado.fechaVencimiento), "dd/MM/yyyy HH:mm") : "N/A"}</span>
        </div>

        <div className="bg-[#F9FAFB] dark:bg-white/5 p-4 rounded-lg mt-6 border border-[#E5E7EB] dark:border-[#1F2937]">
          <p className="text-sm italic text-[#6B7280] dark:text-white/60">"{estado.mensaje}"</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-end">
        {isAdmin && (
          <Button 
            onClick={() => setShowPurchaseCard(true)} 
            variant={isVencido ? "destructive" : "default"}
            className={!isVencido ? "bg-[#F97316] hover:bg-[#EA580C] text-white w-full sm:w-auto" : "w-full sm:w-auto"}
          >
            Renovar Plan Mensual
          </Button>
        )}

        {!isAdmin && isVencido && (
          <p className="text-red-500 font-bold text-sm text-center w-full">
            Contacte a su administrador para renovar el sistema.
          </p>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPanel;
