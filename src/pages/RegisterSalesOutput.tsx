import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import {
  ArrowDownCircle,
  Package,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MovimientoService,
  ProductoBusqueda,
  RegistroSalidaPayload,
} from "@/api/movimientoService";
import { ProductService, LoteDetalle } from "@/api/productService";
import { ProveedorService } from "@/api/proveedorService";
import { DevolucionService, DevolucionCreatePayload } from "@/api/devolucionService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// --- ESQUEMA DEL FORMULARIO PRINCIPAL ---
const formSchema = z.object({
  producto: z.string().optional(),
  cantidad: z.coerce
    .number()
    .positive({ message: "La cantidad debe ser mayor a cero" })
    .int({ message: "Debe ser un número entero" })
    .optional(),
  motivo: z.string().min(1, { message: "Debe seleccionar un motivo" }),
});

// --- ESQUEMAS PARA DEVOLUCIONES ---
const solicitudFormSchema = z.object({
  fechaRecepcion: z
    .string()
    .min(1, { message: "Debe seleccionar una fecha" })
    .refine(
      (date) => {
        const selectedDate = new Date(date + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate > today;
      },
      { message: "La fecha debe ser posterior al día actual" }
    ),
  horaRecepcion: z
    .string()
    .min(1, { message: "Debe seleccionar una hora" })
    .refine(
      (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes;
        const minMinutes = 6 * 60; // 06:00
        const maxMinutes = 22 * 60; // 22:00
        return totalMinutes >= minMinutes && totalMinutes <= maxMinutes;
      },
      { message: "La hora debe estar en el horario de recepción, entre 6:00 am y 10:00 pm" }
    ),
});

// --- INTERFACES LOCALES ---
interface ProductoAgregado {
  id: number;
  nombre: string;
  cantidad: number;
  stock: number;
  precioVenta: number;
}

// --- COMPONENTE DE BÚSQUEDA EXTRAÍDO ---
interface ProductSearchProps {
  field: any;
  query: string;
  setQuery: (query: string) => void;
  suggestions: ProductoBusqueda[] | undefined;
  isLoading: boolean;
  isLocked: boolean;
  onSelectProduct: (product: ProductoBusqueda) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  field,
  query,
  setQuery,
  suggestions,
  isLoading,
  isLocked,
  onSelectProduct,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  function selectProduct(product: ProductoBusqueda) {
    field.onChange(product.idProducto.toString());
    onSelectProduct(product);
    setQuery("");
    setOpen(false);
  }

  return (
    <FormItem ref={containerRef}>
      <FormLabel>Producto *</FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            className="h-11"
            placeholder="Buscar producto por nombre"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              field.onChange(value);
              setOpen(true);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (!open || !suggestions) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((i) =>
                  Math.min(i + 1, suggestions.length - 1)
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (highlightIndex >= 0 && suggestions[highlightIndex]) {
                  selectProduct(suggestions[highlightIndex]);
                }
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            disabled={isLocked}
          />

          {open && (suggestions || isLoading) && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto">
              {isLoading && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Buscando...
                </div>
              )}
              {!isLoading && !suggestions?.length && query && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  No se encontraron productos.
                </div>
              )}
              {!isLoading && !suggestions?.length && !query && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Escriba para buscar...
                </div>
              )}
              {suggestions?.map((p, idx) => (
                <div
                  key={p.idProducto}
                  className={`px-3 py-2 cursor-pointer hover:bg-accent/30 ${idx === highlightIndex ? "bg-accent/40" : ""
                    }`}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    selectProduct(p);
                  }}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">{p.nombreProducto}</div>
                    <div className="text-xs text-muted-foreground">
                      Stock: {p.stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

// --- COMPONENTE PRINCIPAL ---
const RegisterSalesOutput = () => {
  // --- ESTADOS EXISTENTES ---
  const [customMotivo, setCustomMotivo] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<ProductoAgregado[]>(
    []
  );
  const [selectedProduct, setSelectedProduct] =
    useState<ProductoBusqueda | null>(null);
  const [cantidadKey, setCantidadKey] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    productName: string;
    newQuantity: number;
  } | null>(null);
  const [query, setQuery] = useState("");

  // --- NUEVOS ESTADOS PARA DEVOLUCIONES ---
  const [showDevolucionDialog, setShowDevolucionDialog] = useState(false);
  const [selectedProductDevolucionId, setSelectedProductDevolucionId] =
    useState<number | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedLote, setSelectedLote] = useState<LoteDetalle | null>(null);
  const [showSolicitudDialog, setShowSolicitudDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [searchDevolucionQuery, setSearchDevolucionQuery] = useState("");

  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      producto: "",
      cantidad: undefined,
      motivo: "",
    },
  });

  const solicitudForm = useForm<z.infer<typeof solicitudFormSchema>>({
    resolver: zodResolver(solicitudFormSchema),
    defaultValues: {
      fechaRecepcion: "",
      horaRecepcion: "",
    },
  });

  // --- QUERIES EXISTENTES ---
  const {
    data: historial,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ["historialSalidas"],
    queryFn: MovimientoService.obtenerHistorialSalidas,
    refetchOnWindowFocus: false,
  });

  const { data: suggestions, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["buscarProductos", query],
    queryFn: () => MovimientoService.buscarProductos(query),
    staleTime: 1000,
  });

  const registrarSalidaMutation = useMutation({
    mutationFn: MovimientoService.registrarSalida,
    onSuccess: () => {
      toast.success("Salida registrada exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["historialSalidas"] });
      queryClient.invalidateQueries({ queryKey: ["buscarProductos"] });

      form.reset();
      setSelectedProducts([]);
      setSelectedProduct(null);
      setCustomMotivo("");
      setQuery("");
      setIsLocked(false);
      setCantidadKey((k) => k + 1);
    },
    onError: (error: Error) => {
      let errorMessage = "No se pudo conectar al servidor.";
      try {
        const errorJson = JSON.parse(error.message);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = error.message;
      }
      toast.error("Error al registrar la salida", {
        description: errorMessage,
      });
    },
  });

  // --- NUEVAS QUERIES PARA DEVOLUCIONES ---

  // Buscar productos para el diálogo de devolución
  const { data: searchDevolucionResults } = useQuery({
    queryKey: ["buscarProductosDevolucion", searchDevolucionQuery],
    queryFn: () => MovimientoService.buscarProductos(searchDevolucionQuery),
    enabled: showDevolucionDialog && searchDevolucionQuery.length > 0,
    staleTime: 1000,
  });

  // Obtener detalles del producto seleccionado para devolución (incluye lotes)
  const { data: productDetails } = useQuery({
    queryKey: ["productoDetalle", selectedProductDevolucionId],
    queryFn: () =>
      selectedProductDevolucionId
        ? ProductService.getProductoDetalle(selectedProductDevolucionId)
        : Promise.reject("No ID"),
    enabled: !!selectedProductDevolucionId,
  });

  // Obtener lista de proveedores (para mostrar info en solicitud)
  const { data: proveedores, isLoading: isLoadingProveedores } = useQuery({
    queryKey: ["proveedores"],
    queryFn: ProveedorService.listWithCount,
    enabled: showSolicitudDialog,
  });

  // Obtener devoluciones pendientes
  const { 
    data: devolucionesPendientes,
    isLoading: isLoadingDevoluciones,
    error: errorDevoluciones
  } = useQuery({
    queryKey: ["devolucionesPendientes"],
    queryFn: DevolucionService.listarPendientes,
  });

  const registrarDevolucionMutation = useMutation({
    mutationFn: DevolucionService.create,
    onSuccess: () => {
      toast.success("Devolución registrada correctamente");
      queryClient.invalidateQueries({ queryKey: ["devolucionesPendientes"] });
      queryClient.invalidateQueries({ queryKey: ["productoDetalle"] });
      setShowConfirmDialog(false);
      setShowSolicitudDialog(false);
      setShowDevolucionDialog(false);
      setSelectedProductDevolucionId(null);
      setSelectedLote(null);
      solicitudForm.reset();
    },
    onError: (error: Error) => {
        let errorMessage = "Error desconocido";
        try {
            const parsed = JSON.parse(error.message);
            errorMessage = parsed.error || parsed.message || error.message;
        } catch(e) {
            errorMessage = error.message;
        }
      toast.error("Error al registrar la devolución", {
        description: errorMessage,
      });
    },
  });

  // --- LÓGICA DEL FORMULARIO PRINCIPAL ---
  const cantidad = form.watch("cantidad");
  const hasStockError =
    selectedProduct && cantidad && cantidad > selectedProduct.stock;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto a la salida.");
      return;
    }

    const payload: RegistroSalidaPayload = {
      motivo: values.motivo === "otro" ? customMotivo : values.motivo,
      observacion: values.motivo === "otro" ? customMotivo : undefined,
      detalles: selectedProducts.map((p) => ({
        idProducto: p.id,
        cantidad: p.cantidad,
      })),
    };

    registrarSalidaMutation.mutate(payload);
  };

  function addProduct() {
    if (!selectedProduct) {
      toast.error("Debe seleccionar un producto antes de agregarlo");
      return;
    }
    if (!cantidad || cantidad <= 0) {
      toast.error("Debe ingresar una cantidad válida antes de agregarlo");
      return;
    }
    if (cantidad > selectedProduct.stock) {
      toast.error(
        "La cantidad supera el stock disponible del producto seleccionado"
      );
      return;
    }

    const existingProductIndex = selectedProducts.findIndex(
      (product) => product.id === selectedProduct.idProducto
    );

    if (existingProductIndex !== -1) {
      setConfirmation({
        productName: selectedProduct.nombreProducto,
        newQuantity: cantidad,
      });
      return;
    }

    setSelectedProducts((prev) => [
      ...prev,
      {
        id: selectedProduct.idProducto,
        nombre: selectedProduct.nombreProducto,
        cantidad,
        stock: selectedProduct.stock,
        precioVenta: selectedProduct.precioVenta,
      },
    ]);

    form.setValue("producto", "");
    setSelectedProduct(null);
    setQuery("");
    form.resetField("cantidad");
    form.clearErrors("cantidad");
    setCantidadKey((k) => k + 1);
  }

  function removeProduct(productId: number) {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  function confirmUpdate() {
    if (!confirmation) return;
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.nombre === confirmation.productName
          ? { ...product, cantidad: confirmation.newQuantity }
          : product
      )
    );
    toast.success("Cantidad del producto actualizada");
    setConfirmation(null);
  }

  function cancelUpdate() {
    setConfirmation(null);
  }

  // --- LÓGICA DE DEVOLUCIONES ---

  const handleSolicitarDevolucion = (lote: LoteDetalle) => {
    setSelectedLote(lote);
    setShowSolicitudDialog(true);
  };

  const handleConfirmarSolicitud = () => {
    solicitudForm.trigger().then((isValid) => {
      if (isValid) {
        setShowSolicitudDialog(false);
        setShowConfirmDialog(true);
      }
    });
  };

  const handleRegistrarDevolucion = () => {
    const values = solicitudForm.getValues();
    if (!productDetails || !selectedLote) return;

    // VALIDACIÓN IMPORTANTE:
    // Aquí verificamos si el lote tiene ID. Si el backend no lo envía, esto falla.
    if (!selectedLote.idLote) {
        toast.error("Error técnico: El lote seleccionado no tiene ID. Asegúrese de haber actualizado el Backend.");
        return;
    }

    const payload: DevolucionCreatePayload = {
      idProducto: productDetails.idProducto,
      idLote: selectedLote.idLote,
      cantidad: selectedLote.cantidad,
      fechaRecepcion: values.fechaRecepcion,
      horaRecepcion: values.horaRecepcion + ":00",
    };

    registrarDevolucionMutation.mutate(payload);
  };

  // Encontrar info del proveedor
  const proveedorInfo = proveedores?.find(
    (p) =>
      p.nombreProveedor.trim().toLowerCase() ===
      productDetails?.proveedor?.trim().toLowerCase()
  );

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex flex-1">
        <Sidebar activeSection="salidas" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                Registrar Salida por Venta
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Registre las salidas de productos del inventario
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:ml-0 ml-14">
              {/* Formulario */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-destructive" />
                  Registro de Salida
                </h2>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="producto"
                      render={({ field }) => (
                        <ProductSearch
                          field={field}
                          query={query}
                          setQuery={setQuery}
                          suggestions={suggestions}
                          isLoading={isLoadingProducts}
                          isLocked={isLocked}
                          onSelectProduct={setSelectedProduct}
                        />
                      )}
                    />

                    {selectedProduct && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border shadow-md">
                        <h3 className="text-lg font-semibold mb-2">
                          Producto seleccionado
                        </h3>
                        <p className="text-sm font-medium">
                          Nombre:{" "}
                          <span className="text-foreground">
                            {selectedProduct.nombreProducto}
                          </span>
                        </p>
                        <p className="text-sm font-medium">
                          Stock actual:{" "}
                          <span className="text-foreground">
                            {selectedProduct.stock}
                          </span>
                        </p>
                        {selectedProduct.descripcionProducto && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Descripción: {selectedProduct.descripcionProducto}
                          </p>
                        )}
                        <p className="text-sm font-medium mt-2">
                          Precio:{" "}
                          <span className="text-foreground">
                            {selectedProduct.precioVenta?.toFixed(2) ?? "N/A"}
                          </span>
                        </p>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="cantidad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad a retirar *</FormLabel>
                          <FormControl>
                            <Input
                              key={cantidadKey}
                              type="number"
                              step="1"
                              className="h-11"
                              {...field}
                              disabled={!selectedProduct || isLocked}
                            />
                          </FormControl>
                          {hasStockError && (
                            <p className="text-xs text-destructive mt-1">
                              La cantidad supera el stock disponible (
                              {selectedProduct.stock})
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      className="mt-2 h-10 px-4 py-2 text-sm font-medium bg-primary text-white rounded-md self-end"
                      onClick={addProduct}
                      disabled={
                        isLocked ||
                        !selectedProduct ||
                        !cantidad ||
                        cantidad <= 0 ||
                        hasStockError
                      }
                    >
                      Agregar Producto
                    </Button>

                    {selectedProducts.length > 0 && (
                      <div className="space-y-4 mt-4">
                        {selectedProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-4 bg-muted/50 rounded-lg border border-border shadow-md flex justify-between items-center hover:shadow-lg transition-shadow"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Producto: {product.nombre}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Cantidad: {product.cantidad} | Stock:{" "}
                                {product.stock}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Precio:{" "}
                                {product.precioVenta?.toFixed(2) ?? "N/A"} |
                                Subtotal:{" "}
                                {(
                                  product.cantidad * (product.precioVenta || 0)
                                ).toFixed(2)}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeProduct(product.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="motivo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo de salida *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Seleccione un motivo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover">
                              <SelectItem value="Venta">Venta</SelectItem>
                              <SelectItem value="Traslado Interno">
                                Traslado interno
                              </SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />

                          {field.value === "otro" && (
                            <div className="mt-4">
                              <FormLabel>Especifique el motivo</FormLabel>
                              <FormControl>
                                <Input
                                  className="h-11"
                                  placeholder="Ingrese el motivo"
                                  value={customMotivo}
                                  onChange={(e) =>
                                    setCustomMotivo(e.target.value)
                                  }
                                />
                              </FormControl>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    {form.watch("motivo") === "Venta" &&
                      selectedProducts.length > 0 && (
                        <div className="flex justify-end mt-4 text-lg font-bold">
                          Total: S/{" "}
                          {selectedProducts
                            .reduce(
                              (acc, p) => acc + p.cantidad * (p.precioVenta || 0),
                              0
                            )
                            .toFixed(2)}
                        </div>
                      )}

                    <Button
                      type="submit"
                      className="w-full h-12"
                      disabled={
                        registrarSalidaMutation.isPending ||
                        selectedProducts.length === 0
                      }
                    >
                      {registrarSalidaMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Registrar Salida
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Historial */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Historial de Salidas
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {isLoadingHistory && (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Cargando historial...
                      </p>
                    </div>
                  )}
                  {historyError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error al cargar historial</AlertTitle>
                      <AlertDescription>
                        {historyError.message ||
                          "No se pudo conectar al servidor."}
                      </AlertDescription>
                    </Alert>
                  )}
                  {!isLoadingHistory && !historial?.length && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay movimientos registrados
                    </p>
                  )}
                  {historial?.map((item) => (
                    <div
                      key={item.idMovimiento}
                      className="p-3 bg-background/50 border border-border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">
                            Motivo: {item.motivo}
                          </h4>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            {item.detalles.map((detalle, index) => (
                              <p key={index} className="leading-snug">
                                • {detalle.nombreProducto}: {detalle.cantidad}{" "}
                                und. | Precio:{" "}
                                {detalle.precioVenta?.toFixed(2) ?? "N/A"} |
                                Subtotal:{" "}
                                {detalle.subtotal?.toFixed(2) ?? "N/A"}
                              </p>
                            ))}
                            <p className="font-semibold text-foreground pt-1 border-t border-border">
                              Total: S/ {item.totalGeneral?.toFixed(2) ?? "N/A"}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(
                              new Date(item.fechaMovimiento),
                              "dd/MM/yyyy HH:mm"
                            )}{" "}
                            - {item.nombreUsuario}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* --- SECCIÓN DE DEVOLUCIONES --- */}

            {/* Botón de Devolución por Vencimiento */}
            <div className="mt-8 lg:ml-0 ml-14">
              <Button
                onClick={() => setShowDevolucionDialog(true)}
                className="w-full sm:w-auto h-12 flex items-center gap-2"
                variant="outline"
              >
                <RotateCcw className="w-5 h-5" />
                Devolución de Producto por Vencimiento
              </Button>
            </div>

            {/* Lista de Devoluciones Pendientes */}
            <div className="mt-6 lg:ml-0 ml-14 bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Devoluciones Pendientes por Recibir
              </h2>

              {isLoadingDevoluciones && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {errorDevoluciones && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    No se pudieron cargar las devoluciones pendientes.
                  </AlertDescription>
                </Alert>
              )}

              {!isLoadingDevoluciones && !errorDevoluciones && (!devolucionesPendientes || devolucionesPendientes.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay devoluciones pendientes.
                </div>
              )}

              {!isLoadingDevoluciones && devolucionesPendientes && devolucionesPendientes.length > 0 && (
                <div className="space-y-3">
                  {devolucionesPendientes.map((devolucion) => (
                    <div
                      key={devolucion.idDevolucion}
                      className="p-4 bg-background/50 border border-border rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {devolucion.nombreProducto}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Lote: {devolucion.codigoLote}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Proveedor: {devolucion.nombreProveedor || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {devolucion.cantidad}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Fecha de recepción: {devolucion.fechaRecepcion}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Estado: {devolucion.estado}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 text-xs rounded-full font-medium border border-yellow-500/20">
                          {devolucion.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* --- DIÁLOGOS --- */}

      {/* Diálogo de Confirmación de Actualización de Cantidad (Existente) */}
      {confirmation && (
        <AlertDialog
          open={!!confirmation}
          onOpenChange={() => setConfirmation(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Producto ya agregado</AlertDialogTitle>
              <AlertDialogDescription>
                El producto "
                <span className="font-medium">{confirmation.productName}</span>"
                ya está en la lista. ¿Desea actualizar la cantidad a{" "}
                <span className="font-medium">{confirmation.newQuantity}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelUpdate}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmUpdate}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog Principal de Devolución */}
      <Dialog
        open={showDevolucionDialog}
        onOpenChange={setShowDevolucionDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Devolución de Producto por Vencimiento</DialogTitle>
            <DialogDescription>
              Busque y seleccione el producto para gestionar su devolución
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Combobox de búsqueda de productos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Producto *</label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between h-11"
                  >
                    {selectedProductDevolucionId
                      ? searchDevolucionResults?.find(
                        (p) => p.idProducto === selectedProductDevolucionId
                      )?.nombreProducto || "Producto seleccionado"
                      : "Escriba para buscar un producto..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar producto..."
                      value={searchDevolucionQuery}
                      onValueChange={setSearchDevolucionQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron productos.</CommandEmpty>
                      <CommandGroup>
                        {searchDevolucionResults?.map((product) => (
                          <CommandItem
                            key={product.idProducto}
                            value={product.nombreProducto}
                            onSelect={() => {
                              setSelectedProductDevolucionId(product.idProducto);
                              setOpenCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProductDevolucionId === product.idProducto
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {product.nombreProducto}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Tabla de Lotes */}
            {selectedProductDevolucionId && productDetails && (
              <div>
                <h3 className="text-md font-semibold mb-3">
                  Lotes disponibles de {productDetails.nombre}
                </h3>
                {productDetails.lotes && productDetails.lotes.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lote</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Fecha de Vencimiento</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productDetails.lotes.map((lote) => {
                          const fechaVenc = lote.fechaVencimiento
                            ? new Date(lote.fechaVencimiento)
                            : null;
                          const hoy = new Date();
                          hoy.setHours(0, 0, 0, 0);
                          const isVencido =
                            fechaVenc && fechaVenc < hoy;
                          
                          // El botón se habilita solo si:
                          // 1. El producto es perecible
                          // 2. El lote tiene fecha de vencimiento
                          // 3. La fecha de vencimiento es anterior a hoy (está vencido)
                          const canSolicitarDevolucion = 
                            productDetails.perecible && fechaVenc && isVencido;
                          
                          return (
                            <TableRow key={lote.codigoLote}>
                              <TableCell className="font-medium">
                                {lote.codigoLote}
                              </TableCell>
                              <TableCell>{lote.cantidad}</TableCell>
                              <TableCell>
                                <span
                                  className={
                                    isVencido
                                      ? "text-destructive font-semibold"
                                      : ""
                                  }
                                >
                                  {fechaVenc
                                    ? format(fechaVenc, "dd/MM/yyyy")
                                    : "N/A"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => handleSolicitarDevolucion(lote)}
                                  disabled={!canSolicitarDevolucion}
                                  variant={isVencido ? "destructive" : "default"}
                                >
                                  Solicitar Devolución
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay lotes registrados para este producto.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Solicitud de Devolución */}
      <Dialog
        open={showSolicitudDialog}
        onOpenChange={setShowSolicitudDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitar Devolución de Producto</DialogTitle>
            <DialogDescription>
              Complete la información para registrar la devolución
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Información del Proveedor */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Información del Proveedor</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {productDetails?.proveedor || "No registrado"}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {isLoadingProveedores ? (
                    <span className="text-muted-foreground text-xs">
                      Cargando...
                    </span>
                  ) : (
                    proveedorInfo?.telefono || "No disponible"
                  )}
                </p>
              </div>
            </div>

            {/* Información del Lote */}
            {selectedLote && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Información del Lote</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Producto:</span>{" "}
                    {productDetails?.nombre}
                  </p>
                  <p>
                    <span className="font-medium">Lote:</span>{" "}
                    {selectedLote.codigoLote}
                  </p>
                  <p>
                    <span className="font-medium">Cantidad:</span>{" "}
                    {selectedLote.cantidad}
                  </p>
                  <p>
                    <span className="font-medium">Fecha de Vencimiento:</span>{" "}
                    {selectedLote.fechaVencimiento
                      ? format(
                        new Date(selectedLote.fechaVencimiento),
                        "dd/MM/yyyy"
                      )
                      : "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Formulario de Fecha y Hora */}
            <Form {...solicitudForm}>
              <form className="space-y-4">
                <FormField
                  control={solicitudForm.control}
                  name="fechaRecepcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Recepción *</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={solicitudForm.control}
                  name="horaRecepcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Recepción *</FormLabel>
                      <FormControl>
                        <Input type="time" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSolicitudDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmarSolicitud}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmación */}
      <AlertDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Está seguro de registrar esta devolución?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción registrará la devolución del producto y quedará
              pendiente hasta la fecha de recepción programada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegistrarDevolucion}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RegisterSalesOutput;