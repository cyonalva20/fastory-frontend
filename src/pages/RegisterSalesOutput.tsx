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
import { SidebarProvider } from "@/components/SidebarContext";
import AppHeader from "@/components/AppHeader"; // <-- Import AppHeader
import {
  ArrowDownCircle,
  Package,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Check,
  ChevronsUpDown,
  Trash2, // <-- Added Trash2
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
  idProveedor: z.string().min(1, { message: "Debe seleccionar un proveedor" }),
  cantidad: z.coerce
    .number()
    .positive({ message: "La cantidad debe ser mayor a cero" }),
  motivo: z.string().optional(),
  fechaEntrega: z.string().optional(),
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
    <FormItem ref={containerRef} className="space-y-1.5">
      <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Buscar Producto *</FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]"
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
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-md shadow-lg max-h-56 overflow-auto">
              {isLoading && (
                <div className="p-3 text-center text-sm text-[#6B7280]">
                  Buscando...
                </div>
              )}
              {!isLoading && !suggestions?.length && query && (
                <div className="p-3 text-center text-sm text-[#6B7280]">
                  No se encontraron productos.
                </div>
              )}
              {!isLoading && !suggestions?.length && !query && (
                <div className="p-3 text-center text-sm text-[#6B7280]">
                  Escriba para buscar...
                </div>
              )}
              {suggestions?.map((p, idx) => (
                <div
                  key={p.idProducto}
                  className={`px-3 py-2 cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-white/5 ${idx === highlightIndex ? "bg-[#F3F4F6] dark:bg-white/5" : ""
                    }`}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    selectProduct(p);
                  }}
                >
                  <div className="flex justify-between">
                    <div className="font-medium text-[13px]">{p.nombreProducto}</div>
                    <div className="text-xs text-[#6B7280]">
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
  const [selectedProducts, setSelectedProducts] = useState<ProductoAgregado[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductoBusqueda | null>(null);
  const [cantidadKey, setCantidadKey] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    productName: string;
    newQuantity: number;
  } | null>(null);
  const [query, setQuery] = useState("");

  // --- NUEVOS ESTADOS PARA DEVOLUCIONES ---
  const [showDevolucionDialog, setShowDevolucionDialog] = useState(false);
  const [selectedProductDevolucionId, setSelectedProductDevolucionId] = useState<number | null>(null);
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
      idProveedor: "",
      motivo: "",
      fechaEntrega: "",
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

  const { data: searchDevolucionResults } = useQuery({
    queryKey: ["buscarProductosDevolucion", searchDevolucionQuery],
    queryFn: () => MovimientoService.buscarProductos(searchDevolucionQuery),
    enabled: showDevolucionDialog && searchDevolucionQuery.length > 0,
    staleTime: 1000,
  });

  const { data: productDetails } = useQuery({
    queryKey: ["productoDetalle", selectedProductDevolucionId],
    queryFn: () =>
      selectedProductDevolucionId
        ? ProductService.getProductoDetalle(selectedProductDevolucionId)
        : Promise.reject("No ID"),
    enabled: !!selectedProductDevolucionId,
  });

  const { data: proveedores, isLoading: isLoadingProveedores } = useQuery({
    queryKey: ["proveedores"],
    queryFn: ProveedorService.listWithCount,
    enabled: showSolicitudDialog,
  });

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
  const hasStockError = selectedProduct && cantidad && cantidad > selectedProduct.stock;

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
      toast.error("La cantidad supera el stock disponible del producto seleccionado");
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

    if (!selectedLote.idLote) {
        toast.error("Error técnico: El lote seleccionado no tiene ID. Asegúrese de haber actualizado el Backend.");
        return;
    }

    try {
      if (values.cantidad > selectedLote.cantidad) {
        toast.error("La cantidad a devolver no puede exceder la cantidad del lote");
        return;
      }

      const payload: DevolucionCreatePayload = {
        idProducto: productDetails.idProducto,
        idLote: selectedLote.idLote,
        cantidad: values.cantidad,
        idProveedor: parseInt(values.idProveedor, 10),
        motivo: values.motivo || undefined,
        fechaEntrega: values.fechaEntrega || new Date().toISOString().split("T")[0],
      };

      registrarDevolucionMutation.mutate(payload);
    } catch (e) {
        toast.error("Error al procesar los datos");
    }
  };

  const proveedorInfo = proveedores?.find(
    (p) =>
      p.nombreProveedor.trim().toLowerCase() ===
      productDetails?.proveedor?.trim().toLowerCase()
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="salidas" />
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle="Registrar Salida" />
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
              
              <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    Registrar Salida
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    Registre las salidas de productos del inventario
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-6 lg:ml-0 ml-14 items-start">
                {/* Izquierda: Formulario de Salida y Devoluciones */}
                <div className="space-y-6">
                  {/* Formulario */}
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-5 sm:p-6 shadow-sm">
                    <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white mb-5 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-[13px]">
                        1
                      </div>
                      Paso 1: Buscar y Agregar
                    </h3>

                    <style>{`
                      .input-wrapper:hover input {
                        border-color: #EF4444 !important;
                      }
                    `}</style>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          <div className="p-4 bg-[#F9FAFB] dark:bg-white/5 rounded-xl border border-[#E5E7EB] dark:border-[#1F2937] mt-2 animate-fade-in">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-[#9CA3AF]" />
                                <span className="text-[14px] font-semibold text-[#111827] dark:text-white">{selectedProduct.nombreProducto}</span>
                              </div>
                              <span className="text-[12px] font-medium text-[#6B7280] dark:text-[#9CA3AF] bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] px-2 py-1 rounded-md">
                                Stock: {selectedProduct.stock}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="cantidad"
                                render={({ field }) => (
                                  <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Cantidad a retirar *</FormLabel>
                                    <FormControl>
                                      <div className="relative group input-wrapper">
                                        <Input
                                          key={cantidadKey}
                                          type="number"
                                          step="1"
                                          className={`peer h-[46px] bg-white dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-red-500 rounded-[10px] transition-all duration-200 ${hasStockError ? 'border-red-500' : ''}`}
                                          {...field}
                                          disabled={!selectedProduct || isLocked}
                                        />
                                      </div>
                                    </FormControl>
                                    {hasStockError && (
                                      <p className="text-[11px] text-red-500 mt-1 font-medium">
                                        Supera el stock disponible
                                      </p>
                                    )}
                                  </FormItem>
                                )}
                              />
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full h-[46px] border-red-500 text-red-500 hover:bg-red-500/10 rounded-[10px]"
                                  onClick={addProduct}
                                  disabled={isLocked || !selectedProduct || !cantidad || cantidad <= 0 || hasStockError}
                                >
                                  Agregar a la lista
                                </Button>
                              </div>
                            </div>
                            
                            {selectedProduct.descripcionProducto && (
                              <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                                <span className="font-medium">Ref:</span> {selectedProduct.descripcionProducto}
                              </p>
                            )}
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name="motivo"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5 pt-2">
                              <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Motivo de salida *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                                    <SelectValue placeholder="Seleccione un motivo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                                  <SelectItem value="Venta">Venta</SelectItem>
                                  <SelectItem value="Traslado Interno">Traslado interno</SelectItem>
                                  <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />

                              {field.value === "otro" && (
                                <div className="mt-3 animate-fade-in">
                                  <FormControl>
                                    <div className="relative group input-wrapper">
                                      <Input
                                        className="peer h-[50px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-red-500 rounded-[10px] transition-all duration-200"
                                        placeholder=" "
                                        value={customMotivo}
                                        onChange={(e) => setCustomMotivo(e.target.value)}
                                      />
                                      <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-red-500 text-[13px]">
                                        Especifique el motivo
                                      </label>
                                    </div>
                                  </FormControl>
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </div>

                  {/* Devoluciones Card (Moved here) */}
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                      <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <RotateCcw className="w-4 h-4 text-blue-500" />
                        </div>
                        Devoluciones al Proveedor
                      </h3>
                      <Button
                        onClick={() => setShowDevolucionDialog(true)}
                        className="h-9 px-4 text-[12px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-lg transition-colors"
                      >
                        Nueva Devolución
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {isLoadingDevoluciones && (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
                        </div>
                      )}
                      
                      {!isLoadingDevoluciones && (!devolucionesPendientes || devolucionesPendientes.length === 0) && (
                        <p className="text-[13px] text-[#9CA3AF] text-center py-6">No hay devoluciones pendientes</p>
                      )}

                      {!isLoadingDevoluciones && devolucionesPendientes && devolucionesPendientes.length > 0 && (
                        devolucionesPendientes.map((devolucion) => (
                          <div key={devolucion.idDevolucion} className="p-3 bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-[13px] text-[#111827] dark:text-white">
                                  {devolucion.nombreProducto}
                                </h4>
                                <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                                  Lote: {devolucion.codigoLote} | Cantidad: {devolucion.cantidad}
                                </p>
                                <p className="text-[10px] text-[#9CA3AF] dark:text-white/40 mt-1">
                                  Fecha de recepción: {devolucion.fechaRecepcion}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 text-[10px] rounded-full font-medium border border-yellow-200 dark:border-yellow-500/20">
                                {devolucion.estado}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Historial (movido debajo para mejor uso del espacio vertical) */}
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-5 sm:p-6 shadow-sm">
                    <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#9CA3AF]" />
                      Historial Reciente
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {isLoadingHistory ? (
                        <div className="text-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#9CA3AF]" />
                        </div>
                      ) : !historial?.length ? (
                        <p className="text-[13px] text-[#9CA3AF] text-center py-6">No hay salidas registradas</p>
                      ) : (
                        historial.slice(0, 10).map((item) => (
                          <div key={item.idMovimiento} className="p-3 bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-medium text-[13px] text-[#111827] dark:text-white truncate pr-2" title={item.motivo}>{item.motivo}</h4>
                                  <span className="text-[11px] font-semibold text-red-500 whitespace-nowrap">S/ {item.totalGeneral?.toFixed(2) ?? "0.00"}</span>
                                </div>
                                <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] space-y-0.5 mb-1.5">
                                  {item.detalles.slice(0, 2).map((p, i) => (
                                    <p key={i} className="truncate">• {p.cantidad}x {p.nombreProducto}</p>
                                  ))}
                                  {item.detalles.length > 2 && <p>• +{item.detalles.length - 2} más</p>}
                                </div>
                                <p className="text-[10px] text-[#9CA3AF] dark:text-white/40">
                                  {format(new Date(item.fechaMovimiento), "dd/MM/yyyy HH:mm")} · {item.nombreUsuario}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Derecha: Resumen de Salida */}
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm relative overflow-hidden flex flex-col sticky top-6">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500" />
                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white mb-5 flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-[11px]">2</div>
                        Lista de Salida a Procesar
                      </div>
                      <span className="bg-[#F3F4F6] dark:bg-white/10 text-[#6B7280] dark:text-white/60 text-[11px] px-2 py-0.5 rounded-full">
                        {selectedProducts.length} items
                      </span>
                    </h3>

                    {selectedProducts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#F3F4F6] dark:bg-white/5 flex items-center justify-center mb-3">
                          <ArrowDownCircle className="w-6 h-6 text-[#D1D5DB] dark:text-white/20" />
                        </div>
                        <p className="text-[14px] font-medium text-[#4B5563] dark:text-white/60">Lista vacía</p>
                        <p className="text-[12px] text-[#9CA3AF] mt-1 max-w-[200px]">Busque y agregue productos para registrar la salida</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 mb-6">
                          {selectedProducts.map((product) => (
                            <div key={product.id} className="p-3 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl group">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-[13px] font-semibold text-[#111827] dark:text-white leading-tight">
                                  {product.nombre}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeProduct(product.id)}
                                  className="text-[#9CA3AF] hover:text-red-500 transition-colors bg-white dark:bg-[#111827] rounded-md p-1 border border-[#E5E7EB] dark:border-[#1F2937] shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
                                <span>Cant: <strong className="text-[#111827] dark:text-white/90">{product.cantidad}</strong></span>
                                <span>Precio: S/ {product.precioVenta?.toFixed(2) ?? "N/A"}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-[#E5E7EB] dark:border-[#1F2937] flex justify-between items-center">
                                <span className="text-[11px] text-[#9CA3AF]">
                                  Stock restante: {product.stock - product.cantidad}
                                </span>
                                <span className="text-[13px] font-bold text-[#111827] dark:text-white">
                                  S/ {(product.cantidad * (product.precioVenta || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-auto border-t border-[#E5E7EB] dark:border-[#1F2937] pt-4">
                          {form.watch("motivo") === "Venta" && (
                            <div className="flex justify-between items-end mb-5">
                              <span className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Total Venta</span>
                              <span className="text-[24px] font-bold text-[#111827] dark:text-white leading-none">
                                S/ {selectedProducts.reduce((acc, p) => acc + p.cantidad * (p.precioVenta || 0), 0).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <Button 
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={registrarSalidaMutation.isPending}
                            className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-[0_4px_15px_rgba(239,68,68,0.35)] hover:shadow-[0_6px_25px_rgba(239,68,68,0.55)] hover:-translate-y-[1px] transition-all duration-200 rounded-[10px] font-semibold border-none"
                          >
                            {registrarSalidaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Salida
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </main>
        </div>
      </div>

      {/* --- DIÁLOGOS --- */}

      {/* Diálogo de Confirmación de Actualización de Cantidad */}
      {confirmation && (
        <AlertDialog open={!!confirmation} onOpenChange={() => setConfirmation(null)}>
          <AlertDialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#111827] dark:text-white">Producto ya agregado</AlertDialogTitle>
              <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
                El producto "<span className="font-medium text-[#111827] dark:text-white">{confirmation.productName}</span>"
                ya está en la lista. ¿Desea actualizar la cantidad a <span className="font-medium text-[#111827] dark:text-white">{confirmation.newQuantity}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelUpdate} className="border-[#E5E7EB] dark:border-[#1F2937]">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmUpdate} className="bg-red-500 hover:bg-red-600 text-white">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dialog Principal de Devolución */}
      <Dialog open={showDevolucionDialog} onOpenChange={setShowDevolucionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-white">Devolución de Producto por Vencimiento</DialogTitle>
            <DialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
              Busque y seleccione el producto para gestionar su devolución
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">Buscar Producto *</label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                    {selectedProductDevolucionId
                      ? searchDevolucionResults?.find((p) => p.idProducto === selectedProductDevolucionId)?.nombreProducto || "Producto seleccionado"
                      : "Escriba para buscar un producto..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar producto..." value={searchDevolucionQuery} onValueChange={setSearchDevolucionQuery} className="h-11" />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center text-sm text-[#6B7280]">No se encontraron productos.</CommandEmpty>
                      <CommandGroup>
                        {searchDevolucionResults?.map((product) => (
                          <CommandItem
                            key={product.idProducto}
                            value={product.nombreProducto}
                            onSelect={() => {
                              setSelectedProductDevolucionId(product.idProducto);
                              setOpenCombobox(false);
                            }}
                            className="text-[13px] cursor-pointer"
                          >
                            <Check className={cn("mr-2 h-4 w-4 text-[#F97316]", selectedProductDevolucionId === product.idProducto ? "opacity-100" : "opacity-0")} />
                            {product.nombreProducto}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedProductDevolucionId && productDetails && (
              <div className="animate-fade-in">
                <h3 className="text-[14px] font-semibold text-[#111827] dark:text-white mb-3">
                  Lotes disponibles de {productDetails.nombre}
                </h3>
                {productDetails.lotes && productDetails.lotes.length > 0 ? (
                  <div className="border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl overflow-hidden bg-white dark:bg-[#111827]">
                    <Table>
                      <TableHeader className="bg-[#F9FAFB] dark:bg-[#0A0F1E]">
                        <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                          <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] h-10 text-[12px] font-medium">Lote</TableHead>
                          <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] h-10 text-[12px] font-medium">Cantidad</TableHead>
                          <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] h-10 text-[12px] font-medium">Fecha Venc.</TableHead>
                          <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] h-10 text-[12px] font-medium text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productDetails.lotes.map((lote) => {
                          const fechaVenc = lote.fechaVencimiento ? new Date(lote.fechaVencimiento) : null;
                          const hoy = new Date();
                          hoy.setHours(0, 0, 0, 0);
                          const isVencido = fechaVenc && fechaVenc < hoy;
                          return (
                            <TableRow key={lote.codigoLote} className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors">
                              <TableCell className="font-medium text-[13px] text-[#111827] dark:text-white">{lote.codigoLote}</TableCell>
                              <TableCell className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">{lote.cantidad}</TableCell>
                              <TableCell className="text-[13px]">
                                <span className={isVencido ? "text-red-500 font-semibold bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full" : "text-[#6B7280] dark:text-[#9CA3AF]"}>
                                  {fechaVenc ? format(fechaVenc, "dd/MM/yyyy") : "N/A"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    handleSolicitarDevolucion(lote);
                                    solicitudForm.setValue("cantidad", lote.cantidad);
                                  }}
                                  className="h-8 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                                >
                                  Solicitar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#9CA3AF] bg-[#F9FAFB] dark:bg-white/5 p-4 rounded-xl text-center border border-[#E5E7EB] dark:border-[#1F2937]">
                    No hay lotes registrados para este producto.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Solicitud de Devolución */}
      <Dialog open={showSolicitudDialog} onOpenChange={setShowSolicitudDialog}>
        <DialogContent className="max-w-xl bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-white">Solicitar Devolución</DialogTitle>
            <DialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
              Complete la información para registrar la devolución
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl">
                <h3 className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider mb-2">Proveedor</h3>
                <div className="space-y-1 text-[13px]">
                  <p className="text-[#111827] dark:text-white font-medium">{productDetails?.proveedor || "No registrado"}</p>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF]">{isLoadingProveedores ? "Cargando..." : (proveedorInfo?.telefono || "Sin teléfono")}</p>
                </div>
              </div>

              {selectedLote && (
                <div className="p-4 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl">
                  <h3 className="text-[12px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider mb-2">Detalles Lote</h3>
                  <div className="space-y-1 text-[13px]">
                    <p className="text-[#111827] dark:text-white font-medium truncate" title={productDetails?.nombre}>{productDetails?.nombre}</p>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF]">Lote: {selectedLote.codigoLote}</p>
                  </div>
                </div>
              )}
            </div>

            <Form {...solicitudForm}>
              <form className="space-y-4">
                <FormField
                  control={solicitudForm.control}
                  name="idProveedor"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Proveedor *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                            <SelectValue placeholder="Seleccione el proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                          {proveedores?.map((p) => (
                            <SelectItem key={p.idProveedor} value={p.idProveedor.toString()}>{p.nombreProveedor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={solicitudForm.control}
                    name="cantidad"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Cantidad a devolver *</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={selectedLote?.cantidad || 1} className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={solicitudForm.control}
                    name="fechaEntrega"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Fecha Entrega (Opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]" {...field} />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={solicitudForm.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Motivo de la devolución (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Producto dañado..." className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]" {...field} />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowSolicitudDialog(false)} className="h-[42px] border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleConfirmarSolicitud} className="h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-[10px] shadow-sm">
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] dark:text-white">Confirmar Devolución</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
              Esta acción registrará la devolución del producto y quedará pendiente hasta su confirmación final.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E7EB] dark:border-[#1F2937]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegistrarDevolucion} className="bg-blue-600 hover:bg-blue-700 text-white">
              Confirmar Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default RegisterSalesOutput;