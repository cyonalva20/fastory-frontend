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
import { Textarea } from "@/components/ui/textarea";
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
import { FolderOpen, Pencil, Trash2, Plus, LayoutGrid } from "lucide-react";
import {
  CategoriaDetalle,
  CategoryService,
  CategoriaPayload,
} from "@/api/categoryService";

const formSchema = z.object({
  nombreCategoria: z.string().min(1, { message: "El nombre es obligatorio" }),
  descripcion: z.string().optional(),
});

const ManageCategories = () => {
  const [categories, setCategories] = useState<CategoriaDetalle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoriaDetalle | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoriaDetalle | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreCategoria: "",
      descripcion: "",
    },
  });

  const fetchCategories = () => {
    CategoryService.listWithCount()
      .then(setCategories)
      .catch(() => toast.error("No se pudieron cargar las categorías."));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload: CategoriaPayload = {
        nombreCategoria: values.nombreCategoria,
        descripcion: values.descripcion || "",
      };

      if (editingCategory) {
        await CategoryService.update(editingCategory.idCategoria, payload);
        toast.success("Categoría actualizada correctamente");
      } else {
        await CategoryService.create(payload);
        toast.success("Categoría creada correctamente");
      }

      fetchCategories();
      form.reset();
      setIsDialogOpen(false);
      setEditingCategory(null);
    } catch (error: any) {
      try {
        const errorData = JSON.parse(error.message);
        toast.error(errorData.error || errorData.message || "No se pudo guardar la categoría.");
      } catch (e) {
        toast.error(error.message || "No se pudo guardar la categoría.");
      }
    }
  };

  const handleEdit = (category: CategoriaDetalle) => {
    setEditingCategory(category);
    form.setValue("nombreCategoria", category.nombreCategoria);
    form.setValue("descripcion", category.descripcion);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    if (deletingCategory.cantidadProductos > 0) {
      toast.error("No puede eliminar esta categoría porque tiene productos asignados.");
      setDeletingCategory(null);
      return;
    }

    try {
      await CategoryService.delete(deletingCategory.idCategoria);
      toast.success("Categoría eliminada correctamente");
      fetchCategories();
      setDeletingCategory(null);
    } catch (error: any) {
      try {
        const errorData = JSON.parse(error.message);
        toast.error(errorData.error || errorData.message || "No se pudo eliminar la categoría.");
      } catch (e) {
        toast.error(error.message || "No se pudo eliminar la categoría.");
      }
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="administrar-categorias" />
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle="Categorías" />
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
              
              <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    Administrar Categorías
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    Cree, edite o elimine categorías de productos
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm lg:ml-0 ml-14 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F97316]" />
                
                <div className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1F2937] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4 text-[#F97316]" />
                    </div>
                    Listado de Categorías
                    <span className="bg-[#F3F4F6] dark:bg-white/10 text-[#6B7280] dark:text-white/60 text-[11px] px-2 py-0.5 rounded-full ml-2">
                      {categories.length} total
                    </span>
                  </h3>
                  
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) {
                        setEditingCategory(null);
                        form.reset();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="h-10 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] transition-all duration-200 rounded-[10px] font-semibold border-none gap-2"
                        onClick={() => {
                          form.reset();
                          setEditingCategory(null);
                        }}
                      >
                        <Plus className="w-4 h-4" /> Nueva Categoría
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937] sm:max-w-[450px]">
                      <DialogHeader>
                        <DialogTitle className="text-[18px] font-bold text-[#111827] dark:text-white">
                          {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">
                          {editingCategory ? "Modifique los datos de la categoría" : "Complete los datos para crear una categoría"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                          <FormField
                            control={form.control}
                            name="nombreCategoria"
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
                                      Nombre de la categoría *
                                    </label>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[11px] mt-1" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Descripción (opcional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Ingrese una descripción"
                                    className="resize-none h-24 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-[11px]" />
                              </FormItem>
                            )}
                          />
                          <div className="pt-2">
                            <Button type="submit" className="w-full h-[46px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-[10px] font-semibold border-none">
                              {editingCategory ? "Actualizar" : "Crear"} Categoría
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="p-5 sm:p-6 bg-[#F9FAFB]/50 dark:bg-transparent">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {categories.length === 0 ? (
                       <div className="col-span-full py-12 text-center">
                         <FolderOpen className="w-12 h-12 text-[#D1D5DB] dark:text-[#374151] mx-auto mb-3" />
                         <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">No hay categorías registradas.</p>
                       </div>
                    ) : (
                      categories.map((category) => (
                        <div
                          key={category.idCategoria}
                          className="group bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#F97316]/50 dark:hover:border-[#F97316]/50 rounded-[12px] p-4 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex items-start gap-4"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#F97316]/10 group-hover:text-[#F97316] transition-colors">
                            <FolderOpen className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#F97316]" />
                          </div>
                          
                          <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="font-semibold text-[14px] text-[#111827] dark:text-white truncate mb-1 group-hover:text-[#F97316] transition-colors">
                              {category.nombreCategoria}
                            </h3>
                            <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] line-clamp-1 mb-2">
                              {category.descripcion || "Sin descripción"}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F4F6] dark:bg-white/10 text-[#4B5563] dark:text-white/70">
                                {category.cantidadProductos} producto{category.cantidadProductos !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-[#6B7280] hover:text-[#F97316] hover:bg-[#F97316]/10 rounded-md"
                              onClick={() => handleEdit(category)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-[#6B7280] hover:text-red-500 hover:bg-red-500/10 rounded-md"
                              onClick={() => setDeletingCategory(category)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] dark:text-white">Eliminar Categoría</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
              ¿Está seguro que desea eliminar la categoría <span className="font-semibold text-[#111827] dark:text-white">"{deletingCategory?.nombreCategoria}"</span>? 
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

export default ManageCategories;
