import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRol } from "@/hooks/useRol";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { History, ArrowUpCircle, ArrowDownCircle, Edit, Plus, Trash2, ChevronDown, ChevronUp, Save, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";

// Servicios API
import { MovimientoService, MovimientoHistorialDto, ProductoBusqueda, MovimientoUpdatePayload } from "@/api/movimientoService";
import { UserService, UserDto } from "@/api/userService";

const Movements = () => {
  const { isReadOnly } = useRol();
  // --- Estados de Filtros y Datos ---
  const [movements, setMovements] = useState<MovimientoHistorialDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("todos");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // --- Estados para Edición ---
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Formulario de edición
  const [editType, setEditType] = useState<string>("ENTRADA");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editResponsible, setEditResponsible] = useState<string>(""); // ID del usuario como string
  const [editProducts, setEditProducts] = useState<{ idProducto: number, nombre: string, cantidad: number }[]>([]);

  // Datos auxiliares para el formulario
  const [users, setUsers] = useState<UserDto[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [foundProducts, setFoundProducts] = useState<ProductoBusqueda[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<ProductoBusqueda | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- Estados Confirmación ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<number | null>(null);
  const [saveConfirmationOpen, setSaveConfirmationOpen] = useState(false);

  // --- Carga Inicial y Filtros ---

  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const data = await MovimientoService.listarMovimientos(
        fechaDesde || undefined, 
        fechaHasta || undefined, 
        tipoMovimiento === "todos" ? undefined : tipoMovimiento.toUpperCase()
      );
      setMovements(data);
    } catch (error) {
      toast.error("Error al cargar movimientos");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar usuarios para el select de responsable
  useEffect(() => {
    UserService.list().then(setUsers).catch(console.error);
    fetchMovements(); // Carga inicial
  }, []);

  // Efecto para actualizar tabla cuando cambian filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovements();
    }, 500);
    return () => clearTimeout(timer);
  }, [fechaDesde, fechaHasta, tipoMovimiento]);

  const limpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setTipoMovimiento("todos");
  };

  const toggleExpandRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  // --- Lógica de Búsqueda de Productos (Modal) ---
  useEffect(() => {
    if (productSearch.length > 1) {
      MovimientoService.buscarProductos(productSearch)
        .then(setFoundProducts)
        .catch(console.error);
    } else {
      setFoundProducts([]);
    }
  }, [productSearch]);

  // --- Manejadores del Modal de Edición ---

  const handleOpenEdit = (mov: MovimientoHistorialDto) => {
    setEditingId(mov.idMovimiento);
    // Asegurar que el tipo venga en mayúsculas o ajustarlo según tu backend
    setEditType(mov.tipoMovimiento || "SALIDA"); 
    
    // Parsear fecha y hora
    const dt = new Date(mov.fechaMovimiento);
    // Ajuste simple para inputs type="date" y "time"
    setEditDate(dt.toISOString().split('T')[0]);
    setEditTime(dt.toTimeString().slice(0, 5));
    
    // Cargar el ID del usuario responsable
    setEditResponsible(mov.idUsuario ? mov.idUsuario.toString() : "");
    
    // Cargar productos existentes
    const mappedProducts = mov.detalles.map(d => ({
      idProducto: d.idProducto, 
      nombre: d.nombreProducto,
      cantidad: d.cantidad
    }));
    
    setEditProducts(mappedProducts); 
    setEditDialogOpen(true);
  };

  const handleAddProductToEdit = () => {
    if (!selectedProductToAdd || !quantityToAdd) return;
    
    const qty = parseInt(quantityToAdd);
    if (qty <= 0) {
      toast.error("Cantidad inválida");
      return;
    }

    // --- VALIDACIÓN DE STOCK AGREGADA ---
    // Si es una SALIDA, verificamos que la cantidad no supere el stock disponible
    if (editType === "SALIDA") {
      if (qty > selectedProductToAdd.stock) {
        toast.error(`Stock insuficiente. Disponible: ${selectedProductToAdd.stock}`);
        return; // Detener ejecución, no agregar
      }
    }
    // ------------------------------------

    setEditProducts([...editProducts, {
      idProducto: selectedProductToAdd.idProducto,
      nombre: selectedProductToAdd.nombreProducto,
      cantidad: qty
    }]);

    setSelectedProductToAdd(null);
    setQuantityToAdd("");
    setProductSearch("");
    setIsSearchOpen(false);
  };

  const handleRemoveProductFromEdit = (index: number) => {
    setEditProducts(editProducts.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editDate || !editTime || !editResponsible) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    if (editProducts.length === 0) {
      toast.error("El movimiento debe tener al menos un producto");
      return;
    }

    const payload: MovimientoUpdatePayload = {
      tipoMovimiento: editType,
      idResponsable: parseInt(editResponsible),
      fecha: editDate,
      hora: editTime,
      detalles: editProducts.map(p => ({
        idProducto: p.idProducto,
        cantidad: p.cantidad
      }))
    };

    try {
      await MovimientoService.actualizarMovimiento(editingId, payload);
      toast.success("Movimiento actualizado y lotes ajustados");
      setEditDialogOpen(false);
      setSaveConfirmationOpen(false);
      fetchMovements();
    } catch (error: any) {
      const msg = error.message || "Error al actualizar";
      toast.error(msg.includes("Stock") ? "Stock insuficiente en lotes para esta operación" : msg);
    }
  };

  // --- Manejo de Eliminación ---

  const handleDelete = async () => {
    if (!movementToDelete) return;
    try {
      await MovimientoService.eliminarMovimiento(movementToDelete);
      toast.success("Movimiento eliminado y stock revertido en lotes");
      fetchMovements();
    } catch (error: any) {
       const msg = error.message || "Error al eliminar";
       toast.error(msg);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // --- Filtrado de Usuarios por Rol en Modal ---
  const filteredUsers = users.filter(user => {
    if (editType === "ENTRADA") {
      return user.nombreRol.toUpperCase() === "ADMINISTRADOR";
    }
    return true; // Salida: Todos (Admin + Vendedor)
  });

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex flex-1">
        <Sidebar activeSection="movimientos" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                Historial de Movimientos
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Registro completo de entradas y salidas de inventario
              </p>
            </div>

            {/* Filtros */}
            <div className="space-y-6 lg:ml-0 ml-14">
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Desde</Label>
                    <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Hasta</Label>
                    <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
                      <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ENTRADA">Entradas</SelectItem>
                        <SelectItem value="SALIDA">Salidas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={limpiarFiltros}>Limpiar Filtros</Button>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl shadow-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin h-8 w-8 mx-auto"/></TableCell></TableRow>
                    ) : movements.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No se encontraron movimientos</TableCell></TableRow>
                    ) : (
                      movements.map((mov) => (
                        <>
                          <TableRow key={mov.idMovimiento} className="hover:bg-muted/30">
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => toggleExpandRow(mov.idMovimiento)} className="h-8 w-8 p-0">
                                {expandedRows.has(mov.idMovimiento) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Badge variant={mov.tipoMovimiento === "ENTRADA" ? "default" : "destructive"}>
                                {mov.tipoMovimiento === "ENTRADA" ? <ArrowUpCircle className="w-3 h-3 mr-1"/> : <ArrowDownCircle className="w-3 h-3 mr-1"/>}
                                {mov.tipoMovimiento}
                              </Badge>
                            </TableCell>
                            <TableCell>{mov.motivo}</TableCell>
                            <TableCell>{new Date(mov.fechaMovimiento).toLocaleDateString()} {new Date(mov.fechaMovimiento).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</TableCell>
                            <TableCell>{mov.nombreUsuario}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                {!isReadOnly && (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(mov)}><Edit className="h-4 w-4 mr-1"/> Modificar</Button>
                                    <Button variant="destructive" size="sm" onClick={() => { setMovementToDelete(mov.idMovimiento); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 mr-1"/> Eliminar</Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(mov.idMovimiento) && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/20 p-4">
                                <div className="rounded-md border bg-card p-4">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                        <TableHead className="text-right">Precio Unit.</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {mov.detalles.map((det, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell>{det.nombreProducto}</TableCell>
                                          <TableCell className="text-right">{det.cantidad}</TableCell>
                                          <TableCell className="text-right">S/ {mov.tipoMovimiento === "ENTRADA" ? det.precioCompra : det.precioVenta}</TableCell>
                                          <TableCell className="text-right">
                                            S/ {(det.cantidad * (mov.tipoMovimiento === "ENTRADA" ? det.precioCompra : det.precioVenta)).toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      <TableRow className="font-bold">
                                        <TableCell colSpan={3} className="text-right">Total General:</TableCell>
                                        <TableCell className="text-right">
                                          S/ {mov.detalles.reduce((acc, d) => acc + (d.cantidad * (mov.tipoMovimiento === "ENTRADA" ? d.precioCompra : d.precioVenta)), 0).toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modificar Movimiento</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SALIDA">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={editResponsible} onValueChange={setEditResponsible}>
                <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                <SelectContent>
                  {filteredUsers.map(u => (
                    <SelectItem key={u.idUsuario} value={u.idUsuario.toString()}>{u.nombre} {u.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="mb-2 block">Agregar Producto</Label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {selectedProductToAdd ? selectedProductToAdd.nombreProducto : "Buscar producto..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Nombre..." onValueChange={setProductSearch} />
                      <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                          {foundProducts.map((product) => (
                            <CommandItem
                              key={product.idProducto}
                              value={product.nombreProducto}
                              onSelect={() => {
                                setSelectedProductToAdd(product);
                                setIsSearchOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedProductToAdd?.idProducto === product.idProducto ? "opacity-100" : "opacity-0")} />
                              {product.nombreProducto} (Stock: {product.stock})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-24">
                <Input type="number" placeholder="Cant." value={quantityToAdd} onChange={e => setQuantityToAdd(e.target.value)} />
              </div>
              <Button onClick={handleAddProductToEdit}><Plus className="h-4 w-4"/></Button>
            </div>
          </div>

          <div className="mt-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editProducts.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Lista vacía (debe agregar productos)</TableCell></TableRow>
                ) : (
                  editProducts.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{p.nombre}</TableCell>
                      <TableCell className="text-right">{p.cantidad}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveProductFromEdit(idx)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => setSaveConfirmationOpen(true)}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmaciones */}
      <AlertDialog open={saveConfirmationOpen} onOpenChange={setSaveConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Se revertirá el movimiento anterior (afectando el stock) y se aplicará el nuevo. Esta acción es irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              El stock asociado a este movimiento será revertido (Entradas se restarán, Salidas se sumarán).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Movements;