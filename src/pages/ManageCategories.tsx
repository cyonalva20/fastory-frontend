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
import { FolderOpen, Pencil, Trash2, Plus } from "lucide-react";
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
  const [editingCategory, setEditingCategory] =
    useState<CategoriaDetalle | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<CategoriaDetalle | null>(null);

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
        toast.error(
          errorData.error ||
            errorData.message ||
            "No se pudo guardar la categoría."
        );
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
      toast.error(
        "No puede eliminar esta categoría porque tiene productos asignados."
      );
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
        toast.error(
          errorData.error ||
            errorData.message ||
            "No se pudo eliminar la categoría."
        );
      } catch (e) {
        toast.error(error.message || "No se pudo eliminar la categoría.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeSection="administrar-categorias" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-6xl mx-auto">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-outfit font-bold text-foreground">
                Administrar Categorías
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Cree, edite o elimine categorías de productos
              </p>
            </div>

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
                  className="gap-2"
                  size="sm"
                  onClick={() => {
                    form.reset();
                    setEditingCategory(null);
                  }}
                >
                  <Plus className="w-4 h-4" /> Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-popover">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory
                      ? "Modifique los datos"
                      : "Complete los datos"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="nombreCategoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la categoría *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Cereales" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descripción de la categoría"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      {editingCategory ? "Actualizar" : "Crear"} Categoría
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card/60 border border-border/40 rounded-lg p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((category) => (
                <div
                  key={category.idCategoria}
                  className="flex items-center justify-between p-3 bg-background/40 border border-border/30 rounded-lg hover:border-border/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {category.nombreCategoria}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {category.descripcion || "Sin descripción"} · {category.cantidadProductos} producto{category.cantidadProductos !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent className="bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la categoría
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageCategories;
