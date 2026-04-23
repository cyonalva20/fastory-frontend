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
import { FolderOpen, Pencil, Trash2, Plus } from "lucide-react";
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
  const [editingProveedor, setEditingProveedor] =
    useState<ProveedorDetalle | null>(null);
  const [deletingProveedor, setDeletingProveedor] =
    useState<ProveedorDetalle | null>(null);

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
        toast.error(
          errorData.error ||
            errorData.message ||
            "No se pudo guardar el proveedor."
        );
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
      toast.error(
        "No puede eliminar este proveedor porque tiene productos asociados a este."
      );
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
        toast.error(
          errorData.error ||
            errorData.message ||
            "No se pudo eliminar el proveedor."
        );
      } catch (e) {
        toast.error(error.message || "No se pudo eliminar el proveedor.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex flex-1">
        <Sidebar activeSection="administrar-proveedores" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">
                  Administrar Proveedores
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Cree, edite o elimine proveedores de productos.
                </p>
              </div>

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
                    className="gap-2"
                    onClick={() => {
                      form.reset();
                      setEditingProveedor(null);
                    }}
                  >
                    <Plus className="w-4 h-4" /> Nuevo Proveedor
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-popover">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProveedor
                        ? "Editar Proveedor"
                        : "Nuevo Proveedor"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingProveedor
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
                        name="nombreProveedor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del proveedor *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Pioneros del Norte"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rucProveedor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RUC (Opcional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: 10456897125"
                                maxLength={11}
                                value={field.value}
                                onChange={(e) => {
                                  const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 11);
                                  field.onChange(onlyDigits);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: 987654321"
                                inputMode="numeric"
                                maxLength={9}
                                pattern="9\d{8}"
                                value={field.value}
                                onChange={(e) => {
                                  const onlyDigits = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 9);
                                  field.onChange(onlyDigits);
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        {editingProveedor ? "Actualizar" : "Crear"} Proveedor
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-4 sm:p-6">
              <div className="grid gap-4">
                {proveedores.map((proveedor) => (
                  <div
                    key={proveedor.idProveedor}
                    className="flex items-center justify-between p-4 bg-background/50 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {proveedor.nombreProveedor}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          RUC: {proveedor.rucProveedor || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Telf: {proveedor.telefono || "Sin Telefono"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {proveedor.cantidadProductos} producto
                          {proveedor.cantidadProductos !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(proveedor)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeletingProveedor(proveedor)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <AlertDialog
        open={!!deletingProveedor}
        onOpenChange={(open) => !open && setDeletingProveedor(null)}
      >
        <AlertDialogContent className="bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el proveedor
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

export default ManageProveedores;
