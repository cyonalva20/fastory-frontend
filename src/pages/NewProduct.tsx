import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Switch } from "../components/ui/switch";
import { cn } from "../lib/utils";
import AppHeader from "../components/AppHeader";
import { toast } from "sonner";
import { ProductService, ProductPayload } from "../api/productService";
import { CategoryService } from "../api/categoryService";
import { ProveedorService } from "../api/proveedorService";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import AssignLocationButton from "../components/AssignLocationButton";
import { Plus, Minus, CalendarIcon } from "lucide-react";
import { parseISO, format } from "date-fns";

// Esquema de validación del formulario
const formSchema = z
  .object({
    nombreProducto: z
      .string()
      .min(1, { message: "Debe ingresar un nombre para el producto" }),
    precioCompra: z.coerce
      .number()
      .positive({ message: "El precio de compra debe ser mayor a cero" }),
    precioVenta: z.coerce
      .number()
      .positive({ message: "El precio de venta debe ser mayor a cero" }),
    unidadMedida: z
      .string()
      .min(1, { message: "Debe seleccionar una unidad de medida" }),
    idCategoria: z
      .string()
      .min(1, { message: "Debe seleccionar una categoría" }),
    idProveedor: z
      .string()
      .min(1, { message: "Debe seleccionar un proveedor" }),
    stock: z.coerce
      .number()
      .int()
      .min(0, { message: "El stock no puede ser negativo" })
      .default(0),
    stockMinimo: z.coerce
      .number()
      .int()
      .min(0, { message: "El stock mínimo no puede ser negativo" }),
    fechaVencimiento: z.date().optional(),
    noPerecible: z.boolean().optional().default(false),
    descripcion: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si el producto no es perecible, la validación pasa.
      if (data.noPerecible) return true;
      // Si es perecible, la fecha de vencimiento es obligatoria.
      return !!data.fechaVencimiento;
    },
    {
      message:
        "La fecha de vencimiento es obligatoria para productos perecibles.",
      path: ["fechaVencimiento"],
    }
  );

const NewProduct = () => {
  // Estado para la ubicación seleccionada
  const [idUbicacion, setIdUbicacion] = useState<number | null>(null);
  const [locationText, setLocationText] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreProducto: "",
      precioCompra: "" as any,
      precioVenta: "" as any,
      unidadMedida: "",
      idCategoria: "",
      idProveedor: "",
      stock: "" as any,
      stockMinimo: "" as any,
      fechaVencimiento: undefined,
      noPerecible: false,
      descripcion: "",
    },
  });

  const noPerecible = form.watch("noPerecible");
  const [categories, setCategories] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [proveedores, setProveedores] = useState<
    { id: number; nombre: string }[]
  >([]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    CategoryService.list()
      .then(setCategories)
      .catch((err) => {
        console.error("Error cargando categorías:", err);
        toast.error("No se pudieron cargar las categorías.");
      });
  }, []);

  // Cargar proveedores al montar el componente
  useEffect(() => {
    ProveedorService.list()
      .then(setProveedores)
      .catch((err) => {
        console.error("Error cargando proveedores:", err);
        toast.error("No se pudieron cargar los proveedores.");
      });
  }, []);

  // Función callback para recibir la ubicación desde el botón/modal
  const handleLocationSelect = (id: number, displayText: string) => {
    setIdUbicacion(id);
    setLocationText(displayText);
  };

  // Función para enviar el formulario al backend
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!idUbicacion) {
      toast.error("Debe asignar una ubicación al producto.");
      return;
    }

    try {
      const payload: ProductPayload = {
        nombreProducto: values.nombreProducto,
        precioCompra: values.precioCompra,
        precioVenta: values.precioVenta,
        unidadMedida: values.unidadMedida,
        stock: values.stock,
        stockMinimo: values.stockMinimo,
        descripcion: values.descripcion || "",
        idCategoria: parseInt(values.idCategoria),
        idProveedor: parseInt(values.idProveedor),
        fechaVencimiento: values.fechaVencimiento
          ? values.fechaVencimiento.toISOString()
          : null,
        perecible: !values.noPerecible,
        idUbicacion: idUbicacion,
      };

      const responseMessage = await ProductService.create(payload);
      toast.success(responseMessage || "Producto registrado correctamente");

      // Limpiar todo
      form.reset();
      setIdUbicacion(null);
      setLocationText("");
    } catch (error: any) {
      // Manejo de errores mejorado
      try {
        const errorData = JSON.parse(error.message);
        toast.error(
          errorData.error ||
            errorData.message ||
            "No se pudo registrar el producto."
        );
      } catch (e) {
        toast.error(error.message || "No se pudo registrar el producto.");
      }
    }
  };

  const handleIncrement = (field: any, step: number = 1) => {
    const current = parseFloat(field.value) || 0;
    field.onChange(current + step);
  };

  const handleDecrement = (field: any, step: number = 1, min: number = 0) => {
    const current = parseFloat(field.value) || 0;
    if (current - step >= min) {
      field.onChange(current - step);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="nuevo-producto" />
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle="Nuevo Producto" />
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
              <div className="max-w-[1000px] mx-auto">
                <div className="mb-6 lg:ml-0 ml-14">
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    Registrar Nuevo Producto
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    Complete el formulario de forma rápida y sencilla
                  </p>
                </div>

                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-6 shadow-sm lg:ml-0 ml-14 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F97316]" />
                  <style>{`
                    .form-group-hover:has(.input-wrapper:hover) .input-wrapper:not(:hover) {
                      transform: scale(0.98);
                      opacity: 0.7;
                    }
                    .input-wrapper {
                      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .input-wrapper:hover {
                      transform: scale(1.01);
                      z-index: 10;
                    }
                  `}</style>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0 form-group-hover">
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                        
                        {/* Columna Izquierda */}
                        <div className="space-y-6">
                          <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white flex items-center gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                            <span className="w-6 h-6 rounded-md bg-[#F97316]/10 text-[#F97316] flex items-center justify-center text-[11px] font-bold">1</span>
                            Información Básica
                          </h3>
                          
                          <FormField
                            control={form.control}
                            name="nombreProducto"
                            render={({ field, fieldState }) => (
                              <FormItem className="relative space-y-0">
                                <FormControl>
                                  <div className="relative group input-wrapper">
                                    <Input
                                      placeholder=" "
                                      {...field}
                                      className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500' : ''}`}
                                    />
                                    <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px]">
                                      Nombre del producto *
                                    </label>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-xs mt-1" />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="idCategoria"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Categoría *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                                        <SelectValue placeholder="Seleccione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {categories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="idProveedor"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Proveedor *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                                        <SelectValue placeholder="Seleccione" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {proveedores.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Descripción (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Descripción adicional del producto"
                                    className="resize-none h-[112px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px] focus-visible:ring-0 focus-visible:border-[#F97316] text-[14px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Columna Derecha */}
                        <div className="space-y-6">
                          <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white flex items-center gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#1F2937] mt-6 lg:mt-0">
                            <span className="w-6 h-6 rounded-md bg-[#F97316]/10 text-[#F97316] flex items-center justify-center text-[11px] font-bold">2</span>
                            Precios, Stock y Ubicación
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="precioCompra"
                              render={({ field, fieldState }) => (
                                <FormItem className="relative space-y-0">
                                  <FormControl>
                                    <div className="relative group input-wrapper flex items-center border border-[#E5E7EB] dark:border-[#1F2937] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 rounded-[10px] overflow-hidden focus-within:border-[#F97316] focus-within:ring-[3px] focus-within:ring-[#F97316]/10 transition-all duration-200">
                                      <div className="absolute left-3 text-[#9CA3AF] text-[14px] top-1/2 -translate-y-1/2 pointer-events-none">S/</div>
                                      <Input
                                        type="number" step="0.01" placeholder=" "
                                        {...field}
                                        className={`peer h-[54px] pl-8 pr-10 pt-5 pb-2 border-none bg-transparent text-[#111827] dark:text-white focus-visible:ring-0 shadow-none ${fieldState.invalid ? 'border-red-500' : ''}`}
                                      />
                                      <label className="absolute left-8 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px]">
                                        Compra *
                                      </label>
                                      <div className="absolute right-0 flex flex-col h-full border-l border-[#E5E7EB] dark:border-[#1F2937]">
                                        <button type="button" onClick={() => handleIncrement(field, 0.5)} className="flex-1 px-2 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center border-b border-[#E5E7EB] dark:border-[#1F2937] transition-colors"><Plus className="w-3 h-3" /></button>
                                        <button type="button" onClick={() => handleDecrement(field, 0.5, 0.01)} className="flex-1 px-2 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"><Minus className="w-3 h-3" /></button>
                                      </div>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs mt-1" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="precioVenta"
                              render={({ field, fieldState }) => (
                                <FormItem className="relative space-y-0">
                                  <FormControl>
                                    <div className="relative group input-wrapper flex items-center border border-[#E5E7EB] dark:border-[#1F2937] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 rounded-[10px] overflow-hidden focus-within:border-[#F97316] focus-within:ring-[3px] focus-within:ring-[#F97316]/10 transition-all duration-200">
                                      <div className="absolute left-3 text-[#9CA3AF] text-[14px] top-1/2 -translate-y-1/2 pointer-events-none">S/</div>
                                      <Input
                                        type="number" step="0.01" placeholder=" "
                                        {...field}
                                        className={`peer h-[54px] pl-8 pr-10 pt-5 pb-2 border-none bg-transparent text-[#111827] dark:text-white focus-visible:ring-0 shadow-none ${fieldState.invalid ? 'border-red-500' : ''}`}
                                      />
                                      <label className="absolute left-8 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px]">
                                        Venta *
                                      </label>
                                      <div className="absolute right-0 flex flex-col h-full border-l border-[#E5E7EB] dark:border-[#1F2937]">
                                        <button type="button" onClick={() => handleIncrement(field, 0.5)} className="flex-1 px-2 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center border-b border-[#E5E7EB] dark:border-[#1F2937] transition-colors"><Plus className="w-3 h-3" /></button>
                                        <button type="button" onClick={() => handleDecrement(field, 0.5, 0.01)} className="flex-1 px-2 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"><Minus className="w-3 h-3" /></button>
                                      </div>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs mt-1" />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="stock"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Stock</FormLabel>
                                  <FormControl>
                                    <div className="relative flex items-center h-[46px] border border-[#E5E7EB] dark:border-[#1F2937] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 rounded-[10px] overflow-hidden focus-within:border-[#F97316] transition-all">
                                      <button type="button" onClick={() => handleDecrement(field, 1, 0)} className="h-full px-3 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border-r border-[#E5E7EB] dark:border-[#1F2937] transition-colors"><Minus className="w-3 h-3" /></button>
                                      <Input type="number" step="1" {...field} className="h-full flex-1 px-0 text-center border-none bg-transparent focus-visible:ring-0 shadow-none font-medium" />
                                      <button type="button" onClick={() => handleIncrement(field, 1)} className="h-full px-3 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border-l border-[#E5E7EB] dark:border-[#1F2937] transition-colors"><Plus className="w-3 h-3" /></button>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="stockMinimo"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Stock mínimo</FormLabel>
                                  <FormControl>
                                    <div className="relative flex items-center h-[46px] border border-[#E5E7EB] dark:border-[#1F2937] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 rounded-[10px] overflow-hidden focus-within:border-[#F97316] transition-all">
                                      <button type="button" onClick={() => handleDecrement(field, 1, 0)} className="h-full px-3 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border-r border-[#E5E7EB] dark:border-[#1F2937] transition-colors"><Minus className="w-3 h-3" /></button>
                                      <Input type="number" step="1" {...field} className="h-full flex-1 px-0 text-center border-none bg-transparent focus-visible:ring-0 shadow-none font-medium" />
                                      <button type="button" onClick={() => handleIncrement(field, 1)} className="h-full px-3 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border-l border-[#E5E7EB] dark:border-[#1F2937] transition-colors"><Plus className="w-3 h-3" /></button>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="unidadMedida"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Unidad *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                                        <SelectValue placeholder="Selec." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="kg">kg</SelectItem>
                                      <SelectItem value="g">g</SelectItem>
                                      <SelectItem value="l">l</SelectItem>
                                      <SelectItem value="ml">ml</SelectItem>
                                      <SelectItem value="unidad">Unidad</SelectItem>
                                      <SelectItem value="paquete">Pqt</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="p-4 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <FormField
                                control={form.control}
                                name="noPerecible"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                          field.onChange(checked);
                                          if (checked) {
                                            form.resetField("fechaVencimiento");
                                            form.clearErrors("fechaVencimiento");
                                          }
                                        }}
                                        className="data-[state=checked]:bg-[#F97316]"
                                      />
                                    </FormControl>
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-[13px] font-medium text-[#111827] dark:text-white cursor-pointer">
                                        Producto no perecible
                                      </FormLabel>
                                      <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">No requiere fecha de caducidad</p>
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <div className="w-full sm:w-[160px]">
                                <FormField
                                  control={form.control}
                                  name="fechaVencimiento"
                                  render={({ field }) => (
                                    <FormItem className="space-y-1">
                                      <FormLabel className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">Vencimiento {!noPerecible && "*"}</FormLabel>
                                      <FormControl>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className={cn("w-full h-[38px] px-3 text-left font-normal bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937] rounded-[8px]", !field.value && "text-muted-foreground", !!noPerecible && "opacity-50 cursor-not-allowed")}
                                              disabled={!!noPerecible}
                                            >
                                              {field.value ? format(field.value, "PPP") : <span>Seleccionar</span>}
                                              <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0 bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]" align="start">
                                            <Calendar
                                              mode="single"
                                              selected={field.value}
                                              onSelect={field.onChange}
                                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || !!noPerecible}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </FormControl>
                                      <FormMessage className="text-[10px]" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] mb-1.5 block">Asignar Ubicación *</FormLabel>
                            <AssignLocationButton onLocationSelect={handleLocationSelect} selectedText={locationText} />
                          </div>

                        </div>
                      </div>

                      <div className="pt-8 mt-8 border-t border-[#E5E7EB] dark:border-[#1F2937] flex flex-col sm:flex-row items-center justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            form.reset();
                            setIdUbicacion(null);
                            setLocationText("");
                          }}
                          className="w-full sm:w-auto h-11 px-6 rounded-[10px] text-[#4B5563] dark:text-white/70 border-[#E5E7EB] dark:border-[#374151] hover:bg-[#F3F4F6] dark:hover:bg-white/5 transition-colors"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="w-full sm:w-auto h-11 px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] transition-all duration-200 rounded-[10px] font-semibold border-none"
                        >
                          Registrar Producto
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default NewProduct;
