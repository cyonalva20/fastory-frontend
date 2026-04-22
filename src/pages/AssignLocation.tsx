import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import { MapPin, Package, Grid } from "lucide-react";
import {
  RepisaDetalle,
  UbicacionDto,
  UbicacionService,
} from "../api/ubicacionService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// Este componente ahora servirá como un "Visor del Almacén"
const AssignLocation = () => {
  const [repisas, setRepisas] = useState<RepisaDetalle[]>([]);
  const [selectedRepisa, setSelectedRepisa] = useState<RepisaDetalle | null>(
    null
  );
  const [ubicaciones, setUbicaciones] = useState<UbicacionDto[]>([]);

  useEffect(() => {
    // Cargar todas las repisas al inicio
    UbicacionService.listarRepisas()
      .then(setRepisas)
      .catch(() => toast.error("No se pudieron cargar las repisas."));
  }, []);

  const handleRepisaChange = (repisaId: string) => {
    const repisa = repisas.find((r) => r.idRepisa === parseInt(repisaId));
    if (repisa) {
      setSelectedRepisa(repisa);
      // Cargar el detalle de ubicaciones para la repisa seleccionada
      UbicacionService.obtenerDetalleRepisa(repisa.idRepisa)
        .then(setUbicaciones)
        .catch(() => toast.error("No se pudo cargar el detalle de la repisa."));
    }
  };

  const getUbicacionStatus = (
    fila: number,
    columna: number
  ): "LIBRE" | "OCUPADA" => {
    const ubicacion = ubicaciones.find(
      (u) => u.fila === fila && u.columna === columna
    );
    return ubicacion?.estado || "LIBRE";
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex flex-1">
        <Sidebar activeSection="asignar-ubicacion" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">
                Visor de Almacén
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Seleccione una repisa para ver el estado de sus ubicaciones.
              </p>
            </div>

            <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-4 sm:p-6">
              <div className="max-w-xs mb-6">
                <Select onValueChange={handleRepisaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una repisa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repisas.map((r) => (
                      <SelectItem key={r.idRepisa} value={String(r.idRepisa)}>
                        {r.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRepisa && (
                <div
                  className="grid gap-2 overflow-x-auto p-2"
                  style={{
                    gridTemplateColumns: `repeat(${selectedRepisa.numeroColumnas}, minmax(80px, 1fr))`,
                  }}
                >
                  {Array.from(
                    { length: selectedRepisa.numeroFilas },
                    (_, filaIndex) =>
                      Array.from(
                        { length: selectedRepisa.numeroColumnas },
                        (_, colIndex) => {
                          const fila = filaIndex + 1;
                          const columna = colIndex + 1;
                          const status = getUbicacionStatus(fila, columna);
                          return (
                            <div
                              key={`${fila}-${columna}`}
                              className={`p-2 border rounded-md text-center text-xs flex flex-col items-center justify-center h-20 ${
                                status === "OCUPADA"
                                  ? "bg-red-500/20 border-red-500/40"
                                  : "bg-green-500/10 border-green-500/30"
                              }`}
                            >
                              <span className="font-bold text-sm">
                                F{fila}, C{columna}
                              </span>
                              <span
                                className={`mt-1 font-semibold ${
                                  status === "OCUPADA"
                                    ? "text-red-400"
                                    : "text-green-400"
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                          );
                        }
                      )
                  ).flat()}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

    </div>
  );
};

export default AssignLocation;
