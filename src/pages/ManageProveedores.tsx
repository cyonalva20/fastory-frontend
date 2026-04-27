import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import AppHeader from "@/components/AppHeader"; // <-- Import AppHeader
import { Users, Pencil, Trash2, Plus, Phone, FileText } from "lucide-react";
import {
  ProveedorDetalle,
  ProveedorService,
  ProveedorPayload,
} from "@/api/proveedorService";

const formSchema = z.object({
  nombreProveedor: z.string().min(1, { message: "El nombre es obligatorio" }),
  rucProveedor: z.string().regex(/^\d{0,11}$/, "Solo se permiten hasta 11 dígitos numéricos").optional(),
  telefono: z.string().regex(/^9\d{8}$/, {
    message: "El teléfono debe iniciar con 9 y tener exactamente 9 dígitos",
  }),
});

const ManageProveedores = () => {
  const [proveedores, setProveedores] = useState<ProveedorDetalle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<ProveedorDetalle | null>(null);
  const [deletingProveedor, setDeletingProveedor] = useState<ProveedorDetalle | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      nombreProveedor: "",
      rucProveedor: "",
      telefono: "",
    },
  });

  const fetchProveedores = () => {
    ProveedorService.listWithCount()
      .then(setProveedores)
      .catch(() => toast.error("No se pudieron cargar los proveedores."));
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload: ProveedorPayload = {
        nombreProveedor: values.nombreProveedor,
        rucProveedor: values.rucProveedor || "",
        telefono: values.telefono || "",
      };

      if (editingProveedor) {
        await ProveedorService.update(editingProveedor.idProveedor, payload);
        toast.success("Proveedor actualizado correctamente");
      } else {
        await ProveedorService.create(payload);
        toast.success("Proveedor creado correctamente");
      }

      fetchProveedores();
      form.reset();
      setIsDialogOpen(false);
      setEditingProveedor(null);
    } catch (error: any) {
      try {
        const errorData = JSON.parse(error.message);
        toast.error(errorData.error || errorData.message || "No se pudo guardar el proveedor.");
      } catch (e) {
        toast.error(error.message || "No se pudo guardar el proveedor.");
      }
    }
  };

  const handleEdit = (proveedor: ProveedorDetalle) => {
    setEditingProveedor(proveedor);
    form.setValue("nombreProveedor", proveedor.nombreProveedor);
    form.setValue("rucProveedor", proveedor.rucProveedor || "");
    form.setValue("telefono", proveedor.telefono);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProveedor) return;

    if (deletingProveedor.cantidadProductos > 0) {
      toast.error("No puede eliminar este proveedor porque tiene productos asociados a este.");
      setDeletingProveedor(null);
      return;
    }

    try {
      await ProveedorService.delete(deletingProveedor.idProveedor);
      toast.success("Proveedor eliminado correctamente");
      fetchProveedores();
      setDeletingProveedor(null);
    } catch (error: any) {
      try {
        const errorData = JSON.parse(error.message);
        toast.error(errorData.error || errorData.message || "No se pudo eliminar el proveedor.");
      } catch (e) {
        toast.error(error.message || "No se pudo eliminar el proveedor.");
      }
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="administrar-proveedores" />
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle="Proveedores" />
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
              
              <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    Administrar Proveedores
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    Cree, edite o elimine proveedores de productos
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm lg:ml-0 ml-14 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F97316]" />
                
                <div className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1F2937] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#F97316]" />
                    </div>
                    Listado de Proveedores
                    <span className="bg-[#F3F4F6] dark:bg-white/10 text-[#6B7280] dark:text-white/60 text-[11px] px-2 py-0.5 rounded-full ml-2">
                      {proveedores.length} total
                    </span>
                  </h3>
                  
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) {
                        setEditingProveedor(null);
                        form.reset();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="h-10 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] transition-all duration-200 rounded-[10px] font-semibold border-none gap-2"
                        onClick={() => {
                          form.reset();
                          setEditingProveedor(null);
                        }}
                      >
                        <Plus className="w-4 h-4" /> Nuevo Proveedor
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937] sm:max-w-[450px]">
                      <DialogHeader>
                        <DialogTitle className="text-[18px] font-bold text-[#111827] dark:text-white">
                          {editingProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">
                          {editingProveedor ? "Modifique los datos del proveedor" : "Complete los datos para crear un proveedor"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                          <FormField
                            control={form.control}
                            name="nombreProveedor"
                            render={({ field }) => (
                              <FormItem className="relative space-y-0">
                                <FormControl>
                                  <div className="relative group input-wrapper">
                                    <Input
                                      placeholder=" "
                                      {...field}
                                      className="peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] transition-all duration-200"
                                    />
                                    <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px]">
                                      Nombre del proveedor *
                                    </label>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[11px] mt-1" />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="rucProveedor"
                              render={({ field }) => (
                                <FormItem className="relative space-y-0">
                                  <FormControl>
                                    <div className="relative group input-wrapper">
                                      <Input
                                        placeholder=" "
                                        maxLength={11}
                                        value={field.value}
                                        onChange={(e) => {
                                          const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 11);
                                          field.onChange(onlyDigits);
                                        }}
                                        className="peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] transition-all duration-200"
                                      />
                                      <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px]">
                                        RUC (Opcional)
                                      </label>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-[11px] mt-1" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="telefono"
                              render={({ field }) => (
                                <FormItem className="relative space-y-0">
                                  <FormControl>
                                    <div className="relative group input-wrapper">
                                      <Input
                                        placeholder=" "
                                        inputMode="numeric"
                                        maxLength={9}
                                        value={field.value}
                                        onChange={(e) => {
                                          const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 9);
                                          field.onChange(onlyDigits);
                                        }}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                        className="peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] transition-all duration-200"
                                      />
                                      <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px]">
                                        Teléfono *
                                      </label>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-[11px] mt-1" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="pt-2">
                            <Button type="submit" className="w-full h-[46px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-[10px] font-semibold border-none">
                              {editingProveedor ? "Actualizar" : "Crear"} Proveedor
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="p-5 sm:p-6 bg-[#F9FAFB]/50 dark:bg-transparent">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {proveedores.length === 0 ? (
                       <div className="col-span-full py-12 text-center">
                         <Users className="w-12 h-12 text-[#D1D5DB] dark:text-[#374151] mx-auto mb-3" />
                         <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">No hay proveedores registrados.</p>
                       </div>
                    ) : (
                      proveedores.map((proveedor) => (
                        <div
                          key={proveedor.idProveedor}
                          className="group bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#F97316]/50 dark:hover:border-[#F97316]/50 rounded-[12px] p-4 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-col"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#F97316]/10 group-hover:text-[#F97316] transition-colors">
                                <Users className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#F97316]" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-[14px] text-[#111827] dark:text-white group-hover:text-[#F97316] transition-colors line-clamp-1">
                                  {proveedor.nombreProveedor}
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F4F6] dark:bg-white/10 text-[#4B5563] dark:text-white/70 mt-1">
                                  {proveedor.cantidadProductos} producto{proveedor.cantidadProductos !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-[#6B7280] hover:text-[#F97316] hover:bg-[#F97316]/10 rounded-md"
                                onClick={() => handleEdit(proveedor)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-[#6B7280] hover:text-red-500 hover:bg-red-500/10 rounded-md"
                                onClick={() => setDeletingProveedor(proveedor)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#1F2937] grid grid-cols-2 gap-3 mt-auto">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-semibold text-[#9CA3AF] mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> RUC
                              </span>
                              <span className="text-[12px] text-[#4B5563] dark:text-white/80 font-medium">{proveedor.rucProveedor || "No registrado"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-semibold text-[#9CA3AF] mb-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Teléfono
                              </span>
                              <span className="text-[12px] text-[#4B5563] dark:text-white/80 font-medium">{proveedor.telefono || "No registrado"}</span>
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

      <AlertDialog
        open={!!deletingProveedor}
        onOpenChange={(open) => !open && setDeletingProveedor(null)}
      >
        <AlertDialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] dark:text-white">Eliminar Proveedor</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
              ¿Está seguro que desea eliminar al proveedor <span className="font-semibold text-[#111827] dark:text-white">"{deletingProveedor?.nombreProveedor}"</span>? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E7EB] dark:border-[#1F2937]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default ManageProveedores;
