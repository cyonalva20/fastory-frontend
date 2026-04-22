import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import {
  RepisaDetalle,
  UbicacionDto,
  UbicacionService,
  RepisaCreatePayload,
} from "../api/ubicacionService";

interface Props {
  onLocationSelect: (idUbicacion: number, displayText: string) => void;
  selectedText: string;
}

const AssignLocationButton = ({ onLocationSelect, selectedText }: Props) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "addRepisa">("main");

  // Estados para la vista principal
  const [repisas, setRepisas] = useState<RepisaDetalle[]>([]);
  const [selectedRepisa, setSelectedRepisa] = useState<RepisaDetalle | null>(
    null
  );
  const [ubicaciones, setUbicaciones] = useState<UbicacionDto[]>([]);
  const [fila, setFila] = useState("");
  const [columna, setColumna] = useState("");

  // Estados para la vista de agregar repisa
  const [codigo, setCodigo] = useState("");
  const [numeroFilas, setNumeroFilas] = useState("");
  const [numeroColumnas, setNumeroColumnas] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const fetchRepisas = () => {
    UbicacionService.listarRepisas()
      .then(setRepisas)
      .catch(() => toast.error("No se pudieron cargar las repisas."));
  };

  useEffect(() => {
    if (open && view === "main") {
      fetchRepisas();
    }
  }, [open, view]);

  const handleRepisaChange = (repisaId: string) => {
    const repisa = repisas.find((r) => r.idRepisa === parseInt(repisaId));
    if (repisa) {
      setSelectedRepisa(repisa);
      setFila("");
      setColumna("");
      UbicacionService.obtenerDetalleRepisa(repisa.idRepisa)
        .then(setUbicaciones)
        .catch(() => toast.error("No se pudo cargar el detalle de la repisa."));
    }
  };

  const isLocationOccupied = (fila: number, columna: number) => {
    if (!fila || !columna) return false;
    return ubicaciones.some(
      (u) => u.fila === fila && u.columna === columna && u.estado === "OCUPADA"
    );
  };

  const handleAssign = () => {
    if (!selectedRepisa || !fila || !columna) {
      toast.error("Debe seleccionar repisa, fila y columna.");
      return;
    }

    const ubicacion = ubicaciones.find(
      (u) => u.fila === parseInt(fila) && u.columna === parseInt(columna)
    );

    if (ubicacion) {
      if (ubicacion.estado === "OCUPADA") {
        toast.error("Esta ubicación ya está ocupada.");
        return;
      }
      onLocationSelect(
        ubicacion.idUbicacion,
        `Repisa ${selectedRepisa.codigo}, F:${fila}, C:${columna}`
      );
      toast.success("Ubicación pre-seleccionada.");
      setOpen(false);
    } else {
      toast.error("Error: No se encontró la ubicación. Intente de nuevo.");
    }
  };

  const handleCreateRepisa = async () => {
    if (!codigo || !numeroFilas || !numeroColumnas) {
      toast.error("Complete código, filas y columnas.");
      return;
    }
    const payload: RepisaCreatePayload = {
      codigo,
      descripcion,
      numeroFilas: parseInt(numeroFilas),
      numeroColumnas: parseInt(numeroColumnas),
    };
    try {
      await UbicacionService.crearRepisa(payload);
      toast.success("Repisa creada correctamente.");
      setCodigo("");
      setNumeroFilas("");
      setNumeroColumnas("");
      setDescripcion("");
      setView("main");
    } catch (error: any) {
      let errorMessage = "No se pudo crear la repisa.";
      // Intentamos parsear si es JSON, si no, usamos el mensaje directo
      try {
        const errorData = JSON.parse(error.message || "{}");
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Si falla el parseo, es probable que sea texto plano (ej: "Ya existe...")
        if (error.message) {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setView("main");
          setSelectedRepisa(null);
          setFila("");
          setColumna("");
        }
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {selectedText || "Asignar Ubicación *"}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {view === "main" ? "Asignar Ubicación" : "Agregar Nueva Repisa"}
          </DialogTitle>
          <DialogDescription>
            {view === "main"
              ? "Seleccione Repisa, Fila y Columna"
              : "Complete los datos de la nueva repisa"}
          </DialogDescription>
        </DialogHeader>

        {view === "main" ? (
          <div className="space-y-4 pt-4">
            <label className="text-sm font-medium">Repisa</label>
            <Select onValueChange={handleRepisaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una repisa" />
              </SelectTrigger>
              <SelectContent>
                {repisas.map((r) => (
                  <SelectItem key={r.idRepisa} value={String(r.idRepisa)}>
                    {r.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fila</label>
                <Select
                  value={fila}
                  onValueChange={setFila}
                  disabled={!selectedRepisa}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="N/A" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRepisa &&
                      Array.from(
                        { length: selectedRepisa.numeroFilas },
                        (_, i) => i + 1
                      ).map((f) => (
                        <SelectItem key={f} value={String(f)}>
                          {f}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Columna</label>
                <Select
                  value={columna}
                  onValueChange={setColumna}
                  disabled={!selectedRepisa || !fila}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="N/A" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRepisa &&
                      Array.from(
                        { length: selectedRepisa.numeroColumnas },
                        (_, i) => i + 1
                      ).map((c) => (
                        <SelectItem
                          key={c}
                          value={String(c)}
                          disabled={isLocationOccupied(parseInt(fila), c)}
                        >
                          Columna {c}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={handleAssign}>
                Asignar
              </Button>
            </div>

            <div className="pt-3 border-t">
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => setView("addRepisa")}
              >
                ¿No encuentras la repisa? Agrégala aquí.
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Código de repisa (Ej: A1)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <Input
              placeholder="Número de filas"
              type="number"
              value={numeroFilas}
              onChange={(e) => setNumeroFilas(e.target.value)}
            />
            <Input
              placeholder="Número de columnas"
              type="number"
              value={numeroColumnas}
              onChange={(e) => setNumeroColumnas(e.target.value)}
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setView("main")}
              >
                Regresar
              </Button>
              <Button className="flex-1" onClick={handleCreateRepisa}>
                Crear Repisa
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignLocationButton;
