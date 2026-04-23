import { useState, useEffect } from "react"; // <-- useEffect añadido
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
import { format, parseISO } from "date-fns"; // <-- parseISO añadido
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";

// --- IMPORTACIONES DE API ---
import { ProveedorService } from "@/api/proveedorService";
import {
  MovimientoService,
  MovimientoHistorialDto,
  RegistroEntradaDto,
} from "@/api/movimientoService";
import { ProductService } from "@/api/productService";

// --- TIPOS DE DATOS ---

// Para el <Select> de Proveedor
interface ProveedorSimple {
  id: number;
  nombre: string;
}

// Para el estado de un producto seleccionado
interface ProductoProveedor {
  idProducto: number;
  nombreProducto: string;
  esPerecible: boolean;
}

// Para la lista de productos agregados (listos para enviar)
interface ProductoAgregado {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  fechaVencimiento: Date | null;
  perecible: boolean;
}

// Para el historial (basado en MovimientoHistorialDto)
type HistorialEntrada = MovimientoHistorialDto;

// Esquema del formulario principal (solo el proveedor)
const formSchema = z.object({
  proveedor: z.string().min(1, { message: "Debe seleccionar un proveedor" }),
});

const RegisterSupplierInput = () => {
  // --- ESTADOS ---

  // Listas de datos
  const [proveedores, setProveedores] = useState<ProveedorSimple[]>([]);
  const [productos, setProductos] = useState<ProductoProveedor[]>([]);
  const [historial, setHistorial] = useState<HistorialEntrada[]>([]);

  // Selección y formulario
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductoProveedor | null>(null);
  const [quantity, setQuantity] = useState<number | "">("");
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  // Lista de productos a enviar
  const [addedProducts, setAddedProducts] = useState<ProductoAgregado[]>([]);

  // Manejo de duplicados
  const [duplicateConfirmation, setDuplicateConfirmation] = useState<{
    productId: number;
    productName: string;
    newQuantity: number;
    newPurchasePrice: number;
    newSalePrice: number;
    newExpirationDate: Date | null;
  } | null>(null);

  // --- INICIALIZACIÓN DEL FORMULARIO ---
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proveedor: "",
    },
  });

  // --- FUNCIONES DE CARGA DE DATOS (API) ---

  // Cargar proveedores
  const fetchProveedores = async () => {
    try {
      const data = await ProveedorService.list(); // Usa el servicio real
      setProveedores(data);
    } catch (error) {
      toast.error("Error al cargar proveedores.");
    }
  };

  // Cargar historial
  const fetchHistorial = async () => {
    try {
      const data = await MovimientoService.getHistorialEntradas();
      setHistorial(data);
    } catch (error) {
      toast.error("Error al cargar el historial de entradas.");
    }
  };

  // Cargar todos los productos disponibles
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

  // --- EFECTOS ---

  // Cargar proveedores, historial y productos al montar
  useEffect(() => {
    fetchProveedores();
    fetchHistorial();
    fetchProductos();
  }, []);

  // Resetear producto seleccionado al cambiar de proveedor
  useEffect(() => {
    setSelectedProduct(null);
  }, [selectedSupplierId]);

  // --- MANEJADORES DE EVENTOS ---

  const handleSupplierChange = (supplierId: string) => {
    if (addedProducts.length > 0) return; // Bloquear si ya hay productos
    setSelectedSupplierId(supplierId);
  };

  const handleProductSelect = (productIdStr: string) => {
    const productId = Number(productIdStr);
    const product = productos.find((p) => p.idProducto === productId);
    setSelectedProduct(product || null);
    // Resetear campos
    setQuantity("");
    setPurchasePrice("");
    setSalePrice("");
    setExpirationDate(null);
  };

  const addProduct = () => {
    // Validaciones
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
        toast.error(
          "La fecha de vencimiento es obligatoria para productos perecibles"
        );
        return;
      }
      if (
        new Date(expirationDate).setHours(0, 0, 0, 0) <
        new Date().setHours(0, 0, 0, 0)
      ) {
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

    const existingIndex = addedProducts.findIndex(
      (p) => p.idProducto === newProduct.idProducto
    );

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

    // Construir el DTO de Payload
    const payload: RegistroEntradaDto = {
      idProveedor: Number(values.proveedor),
      detalles: addedProducts.map((p) => ({
        idProducto: p.idProducto,
        cantidad: p.cantidad,
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        // Convertir Date a ISO string si existe
        fechaVencimiento: p.fechaVencimiento
          ? p.fechaVencimiento.toISOString()
          : null,
      })),
    };

    try {
      const response = await MovimientoService.registrarEntrada(payload);
      toast.success(response.message || "Entrada registrada exitosamente");

      // Resetear todo
      form.reset({ proveedor: "" });
      setAddedProducts([]);
      setSelectedSupplierId("");
      setProductos([]);
      resetProductFields();

      // Recargar el historial
      fetchHistorial();
    } catch (error: any) {
      try {
        const errorData = JSON.parse(error.message);
        toast.error(
          errorData.error ||
            errorData.message ||
            "No se pudo registrar la entrada."
        );
      } catch (e) {
        toast.error(error.message || "No se pudo registrar la entrada.");
      }
    }
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex flex-1">
        <Sidebar activeSection="entradas" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                Registrar Entrada por Proveedor
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Registre la mercadería recibida de proveedores
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:ml-0 ml-14">
              {/* Formulario */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-primary" />
                  Registro de Entrada
                </h2>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="proveedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleSupplierChange(value);
                            }}
                            value={field.value}
                            disabled={addedProducts.length > 0}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Seleccione un proveedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover">
                              {proveedores.map((prov) => (
                                <SelectItem
                                  key={prov.id}
                                  value={String(prov.id)}
                                >
                                  {prov.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedSupplierId && (
                      <div>
                        <FormLabel>Buscar Producto</FormLabel>
                        <Select
                          onValueChange={handleProductSelect}
                          value={selectedProduct?.idProducto.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Seleccione un producto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover">
                            {productos.map((prod) => (
                              <SelectItem
                                key={prod.idProducto}
                                value={String(prod.idProducto)}
                              >
                                {prod.nombreProducto}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedProduct && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border shadow-md mt-4">
                        <h3 className="text-lg font-semibold mb-2">
                          Producto seleccionado
                        </h3>
                        <p className="text-sm font-medium">
                          Nombre:{" "}
                          <span className="text-foreground">
                            {selectedProduct.nombreProducto}
                          </span>
                        </p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FormLabel>Cantidad *</FormLabel>
                            <Input
                              type="number"
                              placeholder="0"
                              value={quantity}
                              onChange={(e) =>
                                setQuantity(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>Precio Compra *</FormLabel>
                            <Input
                              type="number"
                              placeholder="0.00"
                              inputMode="decimal"
                              step="0.01"
                              min="0.01"
                              value={purchasePrice}
                              onChange={(e) =>
                                setPurchasePrice(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel>Precio Venta *</FormLabel>
                            <Input
                              type="number"
                              placeholder="0.00"
                              inputMode="decimal"
                              step="0.01"
                              min="0.01"
                              value={salePrice}
                              onChange={(e) =>
                                setSalePrice(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              className="h-11"
                            />
                          </div>
                        </div>
                        <FormLabel className="mt-4 inline-block">
                          {selectedProduct?.esPerecible
                            ? "Fecha de vencimiento *"
                            : "Fecha de vencimiento (opcional)"}
                        </FormLabel>
                        {selectedProduct?.esPerecible ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-11 pl-3 text-left font-normal mt-2",
                                  !expirationDate && "text-muted-foreground"
                                )}
                              >
                                {expirationDate
                                  ? format(expirationDate, "PPP")
                                  : "Seleccione fecha"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 bg-popover"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={expirationDate}
                                onSelect={(date) =>
                                  setExpirationDate(date as Date)
                                }
                                disabled={(date) =>
                                  date <
                                  new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              className="w-full h-11 pl-3 text-left font-normal mt-0 text-muted-foreground"
                              disabled
                            >
                              No aplica
                            </Button>
                          </div>
                        )}
                        <Button
                          type="button"
                          className="w-full mt-4"
                          onClick={addProduct}
                        >
                          Agregar Producto
                        </Button>
                      </div>
                    )}

                    {duplicateConfirmation && (
                      <div className="mt-4 p-4 border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                        <p className="text-sm font-medium mb-2">
                          El producto "{duplicateConfirmation.productName}" ya
                          fue agregado.
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          ¿Desea actualizar la información del producto a
                          ingresar?
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelDuplicateUpdate}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={confirmDuplicateUpdate}
                          >
                            Confirmar
                          </Button>
                        </div>
                      </div>
                    )}

                    {addedProducts.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Productos Agregados
                        </h3>
                        <div className="space-y-3">
                          {addedProducts.map((product) => (
                            <div
                              key={product.idProducto}
                              className="p-3 bg-muted/50 rounded-lg border border-border shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium">
                                  Producto:{" "}
                                  <span className="text-foreground">
                                    {product.nombre}
                                  </span>
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setAddedProducts((prev) =>
                                      prev.filter(
                                        (p) =>
                                          p.idProducto !== product.idProducto
                                      )
                                    );
                                    toast.success(
                                      "Producto eliminado de la lista"
                                    );
                                  }}
                                  aria-label={`Eliminar ${product.nombre}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Cantidad: {product.cantidad}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Precio Compra:{" "}
                                {product.precioCompra.toFixed(2)} | Venta:{" "}
                                {product.precioVenta.toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Subtotal (Compra):{" "}
                                {(
                                  product.cantidad * product.precioCompra
                                ).toFixed(2)}
                              </p>
                              {product.perecible ? (
                                product.fechaVencimiento ? (
                                  <p className="text-sm text-muted-foreground">
                                    Fecha de vencimiento:{" "}
                                    {format(
                                      product.fechaVencimiento as Date,
                                      "PPP"
                                    )}
                                  </p>
                                ) : (
                                  <p className="text-sm text-destructive">
                                    Fecha de vencimiento: REQUERIDA
                                  </p>
                                )
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  Fecha de vencimiento: No aplica
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end mt-4 text-sm font-medium">
                          Total:{" S/ "}
                          <span className="ml-1">
                            {addedProducts
                              .reduce(
                                (acc, p) => acc + p.cantidad * p.precioCompra,
                                0
                              )
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12">
                      Registrar Entrada
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Historial */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Historial de Entradas
                </h2>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {historial.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay entradas registradas
                    </p>
                  ) : (
                    historial.map((item) => (
                      <div
                        key={item.idMovimiento}
                        className="p-3 bg-background/50 border border-border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">
                              {item.motivo}
                            </h4>
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              {item.detalles.map((p, i) => (
                                <p key={i} className="leading-snug">
                                  • {p.nombreProducto}: {p.cantidad} und. |
                                  P. Compra: {p.precioCompra.toFixed(2)} |
                                  Subtotal: {p.subtotal.toFixed(2)}
                                </p>
                              ))}
                              <p className="font-semibold text-foreground pt-1 border-t border-border">
                                Total: S/ {item.totalGeneral.toFixed(2)}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(
                                parseISO(item.fechaMovimiento),
                                "dd/MM/yyyy HH:mm"
                              )}{" "}
                              - {item.nombreUsuario}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegisterSupplierInput;
