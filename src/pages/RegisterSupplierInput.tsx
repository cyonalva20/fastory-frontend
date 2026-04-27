import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ArrowUpCircle, Trash2, Package } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import AppHeader from "@/components/AppHeader"; // <-- Import AppHeader

import { ProveedorService } from "@/api/proveedorService";
import {
  MovimientoService,
  MovimientoHistorialDto,
  RegistroEntradaDto,
} from "@/api/movimientoService";
import { ProductService } from "@/api/productService";

interface ProveedorSimple {
  id: number;
  nombre: string;
}

interface ProductoProveedor {
  idProducto: number;
  nombreProducto: string;
  esPerecible: boolean;
}

interface ProductoAgregado {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  fechaVencimiento: Date | null;
  perecible: boolean;
}

type HistorialEntrada = MovimientoHistorialDto;

const formSchema = z.object({
  proveedor: z.string().min(1, { message: "Debe seleccionar un proveedor" }),
});

const RegisterSupplierInput = () => {
  const [proveedores, setProveedores] = useState<ProveedorSimple[]>([]);
  const [productos, setProductos] = useState<ProductoProveedor[]>([]);
  const [historial, setHistorial] = useState<HistorialEntrada[]>([]);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<ProductoProveedor | null>(null);
  const [quantity, setQuantity] = useState<number | "">("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  const [addedProducts, setAddedProducts] = useState<ProductoAgregado[]>([]);

  const [duplicateConfirmation, setDuplicateConfirmation] = useState<{
    productId: number;
    productName: string;
    newQuantity: number;
    newPurchasePrice: number;
    newSalePrice: number;
    newExpirationDate: Date | null;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proveedor: "",
    },
  });

  const fetchProveedores = async () => {
    try {
      const data = await ProveedorService.list();
      setProveedores(data);
    } catch (error) {
      toast.error("Error al cargar proveedores.");
    }
  };

  const fetchHistorial = async () => {
    try {
      const data = await MovimientoService.getHistorialEntradas();
      setHistorial(data);
    } catch (error) {
      toast.error("Error al cargar el historial de entradas.");
    }
  };

  const fetchProductos = async () => {
    try {
      const data = await ProductService.getInventario({});
      const mapped = data.map(p => ({
        idProducto: p.idProducto,
        nombreProducto: p.nombre,
        esPerecible: p.perecible || false
      }));
      setProductos(mapped);
    } catch (error) {
      toast.error("Error al cargar catálogo de productos.");
    }
  };

  useEffect(() => {
    fetchProveedores();
    fetchHistorial();
    fetchProductos();
  }, []);

  useEffect(() => {
    setSelectedProduct(null);
  }, [selectedSupplierId]);

  const handleSupplierChange = (supplierId: string) => {
    if (addedProducts.length > 0) return;
    setSelectedSupplierId(supplierId);
  };

  const handleProductSelect = (productIdStr: string) => {
    const productId = Number(productIdStr);
    const product = productos.find((p) => p.idProducto === productId);
    setSelectedProduct(product || null);
    setQuantity("");
    setPurchasePrice("");
    setSalePrice("");
    setExpirationDate(null);
  };

  const addProduct = () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      toast.error("Debe seleccionar un producto y una cantidad válida");
      return;
    }
    if (purchasePrice === "" || !isFinite(Number(purchasePrice))) {
      toast.error("Debe ingresar un precio de compra válido");
      return;
    }
    const purchasePriceNum = Number(purchasePrice);
    if (purchasePriceNum <= 0) {
      toast.error("El precio de compra debe ser mayor a 0");
      return;
    }

    if (salePrice === "" || !isFinite(Number(salePrice))) {
      toast.error("Debe ingresar un precio de venta válido");
      return;
    }
    const salePriceNum = Number(salePrice);
    if (salePriceNum <= 0) {
      toast.error("El precio de venta debe ser mayor a 0");
      return;
    }

    if (selectedProduct?.esPerecible) {
      if (!expirationDate) {
        toast.error("La fecha de vencimiento es obligatoria para productos perecibles");
        return;
      }
      if (new Date(expirationDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
        toast.error("La fecha de vencimiento no puede estar en el pasado");
        return;
      }
    }

    const newProduct: ProductoAgregado = {
      idProducto: selectedProduct.idProducto,
      nombre: selectedProduct.nombreProducto,
      cantidad: Number(quantity),
      precioCompra: purchasePriceNum,
      precioVenta: salePriceNum,
      fechaVencimiento: expirationDate || null,
      perecible: selectedProduct.esPerecible || false,
    };

    const existingIndex = addedProducts.findIndex((p) => p.idProducto === newProduct.idProducto);

    if (existingIndex !== -1) {
      setDuplicateConfirmation({
        productId: newProduct.idProducto,
        productName: newProduct.nombre,
        newQuantity: newProduct.cantidad,
        newPurchasePrice: newProduct.precioCompra,
        newSalePrice: newProduct.precioVenta,
        newExpirationDate: newProduct.fechaVencimiento,
      });
      return;
    }

    setAddedProducts((prev) => [...prev, newProduct]);
    resetProductFields();
    toast.success("Producto agregado");
  };

  const resetProductFields = () => {
    setSelectedProduct(null);
    setQuantity("");
    setPurchasePrice("");
    setSalePrice("");
    setExpirationDate(null);
  };

  function confirmDuplicateUpdate() {
    if (!duplicateConfirmation) return;
    setAddedProducts((prev) =>
      prev.map((p) =>
        p.idProducto === duplicateConfirmation.productId
          ? {
              ...p,
              cantidad: duplicateConfirmation.newQuantity,
              precioCompra: duplicateConfirmation.newPurchasePrice,
              precioVenta: duplicateConfirmation.newSalePrice,
              fechaVencimiento: duplicateConfirmation.newExpirationDate,
            }
          : p
      )
    );
    toast.success("Información del producto actualizada");
    setDuplicateConfirmation(null);
    resetProductFields();
  }

  function cancelDuplicateUpdate() {
    setDuplicateConfirmation(null);
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (addedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }

    const payload: RegistroEntradaDto = {
      idProveedor: Number(values.proveedor),
      detalles: addedProducts.map((p) => ({
        idProducto: p.idProducto,
        cantidad: p.cantidad,
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        fechaVencimiento: p.fechaVencimiento ? p.fechaVencimiento.toISOString() : null,
      })),
    };

    try {
      const response = await MovimientoService.registrarEntrada(payload);
      toast.success(response.message || "Entrada registrada exitosamente");

      form.reset({ proveedor: "" });
      setAddedProducts([]);
      setSelectedSupplierId("");
      resetProductFields();
      fetchHistorial();
    } catch (error: any) {
      try {
        const errorData = JSON.parse(error.message);
        toast.error(errorData.error || errorData.message || "No se pudo registrar la entrada.");
      } catch (e) {
        toast.error(error.message || "No se pudo registrar la entrada.");
      }
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="entradas" />
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle="Registrar Entrada" />
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
              
              <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    Registrar Entrada
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    Registre la mercadería recibida de proveedores
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-6 lg:ml-0 ml-14 items-start">
                {/* Izquierda: Formulario y Buscador */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-5 sm:p-6 shadow-sm">
                    <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white mb-5 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316] font-bold text-[13px]">
                        1
                      </div>
                      Paso 1: Buscar y Agregar
                    </h3>

                    <style>{`
                      .input-wrapper:hover input {
                        border-color: #F97316 !important;
                      }
                    `}</style>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                          control={form.control}
                          name="proveedor"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Proveedor *</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleSupplierChange(value);
                                }}
                                value={field.value}
                                disabled={addedProducts.length > 0}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                                    <SelectValue placeholder="Seleccione un proveedor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                                  {proveedores.map((prov) => (
                                    <SelectItem key={prov.id} value={String(prov.id)}>{prov.nombre}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        {selectedSupplierId && (
                          <div className="space-y-1.5">
                            <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Buscar Producto</FormLabel>
                            <Select onValueChange={handleProductSelect} value={selectedProduct?.idProducto.toString() || ""}>
                              <FormControl>
                                <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                                  <SelectValue placeholder="Seleccione un producto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                                {productos.map((prod) => (
                                  <SelectItem key={prod.idProducto} value={String(prod.idProducto)}>{prod.nombreProducto}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {selectedProduct && (
                          <div className="p-4 bg-[#F9FAFB] dark:bg-white/5 rounded-xl border border-[#E5E7EB] dark:border-[#1F2937] mt-2 animate-fade-in">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                              <Package className="w-4 h-4 text-[#9CA3AF]" />
                              <span className="text-[14px] font-semibold text-[#111827] dark:text-white">{selectedProduct.nombreProducto}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="relative group input-wrapper">
                                <Input
                                  type="number" placeholder=" " value={quantity}
                                  onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                                  className="peer h-[50px] px-4 pt-5 pb-2 bg-white dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] transition-all duration-200"
                                />
                                <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px]">
                                  Cantidad *
                                </label>
                              </div>
                              <div className="relative group input-wrapper">
                                <Input
                                  type="number" step="0.01" min="0.01" placeholder=" " value={purchasePrice}
                                  onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                                  className="peer h-[50px] px-4 pt-5 pb-2 bg-white dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] transition-all duration-200"
                                />
                                <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px]">
                                  P. Compra *
                                </label>
                              </div>
                              <div className="relative group input-wrapper">
                                <Input
                                  type="number" step="0.01" min="0.01" placeholder=" " value={salePrice}
                                  onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                                  className="peer h-[50px] px-4 pt-5 pb-2 bg-white dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] transition-all duration-200"
                                />
                                <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px]">
                                  P. Venta *
                                </label>
                              </div>
                            </div>

                            <div className="mt-4">
                              <FormLabel className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] mb-1.5 block">
                                {selectedProduct?.esPerecible ? "Fecha de vencimiento *" : "Fecha de vencimiento (no aplica)"}
                              </FormLabel>
                              {selectedProduct?.esPerecible ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn("w-full h-[46px] pl-3 text-left font-normal bg-white dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]", !expirationDate && "text-muted-foreground")}
                                    >
                                      {expirationDate ? format(expirationDate, "PPP") : "Seleccione fecha"}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]" align="start">
                                    <Calendar
                                      mode="single" selected={expirationDate} onSelect={(date) => setExpirationDate(date as Date)}
                                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <Button variant="outline" className="w-full h-[46px] pl-3 text-left font-normal bg-[#F3F4F6] dark:bg-white/5 border-transparent text-muted-foreground rounded-[10px]" disabled>
                                  No aplica
                                </Button>
                              )}
                            </div>

                            <Button type="button" variant="outline" className="w-full mt-5 h-10 border-[#F97316] text-[#F97316] hover:bg-[#F97316]/10 rounded-[10px]" onClick={addProduct}>
                              Agregar a la lista
                            </Button>
                          </div>
                        )}

                        {duplicateConfirmation && (
                          <div className="p-4 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 rounded-xl mt-4 animate-fade-in">
                            <p className="text-[13px] font-medium text-amber-800 dark:text-amber-200 mb-1">
                              El producto "{duplicateConfirmation.productName}" ya fue agregado.
                            </p>
                            <p className="text-[12px] text-amber-700/80 dark:text-amber-200/70 mb-4">
                              ¿Desea actualizar la información con los nuevos valores?
                            </p>
                            <div className="flex gap-2 justify-end">
                              <Button type="button" variant="outline" size="sm" onClick={cancelDuplicateUpdate} className="h-8 text-xs border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300">
                                Cancelar
                              </Button>
                              <Button type="button" size="sm" onClick={confirmDuplicateUpdate} className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white">
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        )}
                      </form>
                    </Form>
                  </div>

                  {/* Historial (movido debajo del form para mejor uso del espacio vertical) */}
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-5 sm:p-6 shadow-sm">
                    <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white mb-4">
                      Historial Reciente
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {historial.length === 0 ? (
                        <p className="text-[13px] text-[#9CA3AF] text-center py-6">No hay entradas registradas</p>
                      ) : (
                        historial.slice(0, 10).map((item) => (
                          <div key={item.idMovimiento} className="p-3 bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-[#10B981]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-medium text-[13px] text-[#111827] dark:text-white">{item.motivo}</h4>
                                  <span className="text-[11px] font-semibold text-[#10B981]">S/ {item.totalGeneral.toFixed(2)}</span>
                                </div>
                                <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] space-y-0.5 mb-1.5">
                                  {item.detalles.slice(0, 2).map((p, i) => (
                                    <p key={i} className="truncate">• {p.cantidad}x {p.nombreProducto}</p>
                                  ))}
                                  {item.detalles.length > 2 && <p>• +{item.detalles.length - 2} más</p>}
                                </div>
                                <p className="text-[10px] text-[#9CA3AF] dark:text-white/40">
                                  {format(parseISO(item.fechaMovimiento), "dd/MM/yyyy HH:mm")} · {item.nombreUsuario}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Derecha: Resumen de Entrada */}
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm relative overflow-hidden flex flex-col sticky top-6">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F97316]" />
                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white mb-5 flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#F97316]/10 flex items-center justify-center text-[#F97316] font-bold text-[11px]">2</div>
                        Lista de Entrada a Procesar
                      </div>
                      <span className="bg-[#F3F4F6] dark:bg-white/10 text-[#6B7280] dark:text-white/60 text-[11px] px-2 py-0.5 rounded-full">
                        {addedProducts.length} items
                      </span>
                    </h3>

                    {addedProducts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#F3F4F6] dark:bg-white/5 flex items-center justify-center mb-3">
                          <Package className="w-6 h-6 text-[#D1D5DB] dark:text-white/20" />
                        </div>
                        <p className="text-[14px] font-medium text-[#4B5563] dark:text-white/60">Lista vacía</p>
                        <p className="text-[12px] text-[#9CA3AF] mt-1 max-w-[200px]">Busque y agregue productos para registrar la entrada</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 mb-6">
                          {addedProducts.map((product) => (
                            <div key={product.idProducto} className="p-3 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl group">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-[13px] font-semibold text-[#111827] dark:text-white leading-tight">
                                  {product.nombre}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddedProducts((prev) => prev.filter((p) => p.idProducto !== product.idProducto));
                                    toast.success("Producto eliminado");
                                  }}
                                  className="text-[#9CA3AF] hover:text-red-500 transition-colors bg-white dark:bg-[#111827] rounded-md p-1 border border-[#E5E7EB] dark:border-[#1F2937] shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
                                <span>Cant: <strong className="text-[#111827] dark:text-white/90">{product.cantidad}</strong></span>
                                <span>Compra: S/ {product.precioCompra.toFixed(2)}</span>
                                <span>Venta: S/ {product.precioVenta.toFixed(2)}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-[#E5E7EB] dark:border-[#1F2937] flex justify-between items-center">
                                <span className="text-[11px] text-[#9CA3AF]">
                                  {product.perecible ? (product.fechaVencimiento ? `Vence: ${format(product.fechaVencimiento, "dd/MM/yy")}` : <span className="text-red-500">Sin fecha</span>) : "No perecible"}
                                </span>
                                <span className="text-[13px] font-bold text-[#F97316]">
                                  S/ {(product.cantidad * product.precioCompra).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-auto border-t border-[#E5E7EB] dark:border-[#1F2937] pt-4">
                          <div className="flex justify-between items-end mb-5">
                            <span className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Total Entrada</span>
                            <span className="text-[24px] font-bold text-[#111827] dark:text-white leading-none">
                              S/ {addedProducts.reduce((acc, p) => acc + p.cantidad * p.precioCompra, 0).toFixed(2)}
                            </span>
                          </div>
                          <Button 
                            onClick={form.handleSubmit(onSubmit)}
                            className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] transition-all duration-200 rounded-[10px] font-semibold border-none"
                          >
                            Confirmar Entrada
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
    </SidebarProvider>
  );
};

export default RegisterSupplierInput;
