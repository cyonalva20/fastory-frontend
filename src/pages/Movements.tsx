import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { History, ArrowUpCircle, ArrowDownCircle, Edit, Plus, Trash2, ChevronDown, ChevronUp, Save, Check, ChevronsUpDown, Loader2, Calendar as CalendarIcon, Filter, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
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
import AppHeader from "@/components/AppHeader"; // <-- Import AppHeader

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
  const [editResponsible, setEditResponsible] = useState<string>("");
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

  useEffect(() => {
    UserService.list().then(setUsers).catch(console.error);
    fetchMovements();
  }, []);

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

  useEffect(() => {
    if (productSearch.length > 1) {
      MovimientoService.buscarProductos(productSearch)
        .then(setFoundProducts)
        .catch(console.error);
    } else {
      setFoundProducts([]);
    }
  }, [productSearch]);

  const handleOpenEdit = (mov: MovimientoHistorialDto) => {
    setEditingId(mov.idMovimiento);
    setEditType(mov.tipoMovimiento || "SALIDA"); 
    
    const dt = new Date(mov.fechaMovimiento);
    setEditDate(dt.toISOString().split('T')[0]);
    setEditTime(dt.toTimeString().slice(0, 5));
    
    setEditResponsible(mov.idUsuario ? mov.idUsuario.toString() : "");
    
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

    if (editType === "SALIDA") {
      if (qty > selectedProductToAdd.stock) {
        toast.error(`Stock insuficiente. Disponible: ${selectedProductToAdd.stock}`);
        return;
      }
    }

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

  const handleEditProductQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    const newProducts = [...editProducts];
    newProducts[index].cantidad = newQuantity;
    setEditProducts(newProducts);
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

  const filteredUsers = users.filter(user => {
    if (editType === "ENTRADA") {
      return user.nombreRol.toUpperCase() === "ADMINISTRADOR";
    }
    return true; 
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="movimientos" />
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle="Movimientos" />
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
              
              <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    Historial de Movimientos
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    Registro completo de entradas y salidas de inventario
                  </p>
                </div>
              </div>

              <div className="space-y-6 lg:ml-0 ml-14">
                {/* Filtros */}
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500" />
                  <div className="flex items-center gap-2 mb-5">
                    <Filter className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                    <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">Filtros de Búsqueda</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] pl-1">Fecha Desde</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]",
                              !fechaDesde && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaDesde ? format(parseISO(fechaDesde), "PPP") : <span>Seleccione fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]" align="start">
                          <Calendar
                            mode="single"
                            selected={fechaDesde ? parseISO(fechaDesde) : undefined}
                            onSelect={(date) => setFechaDesde(date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] pl-1">Fecha Hasta</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]",
                              !fechaHasta && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fechaHasta ? format(parseISO(fechaHasta), "PPP") : <span>Seleccione fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]" align="start">
                          <Calendar
                            mode="single"
                            selected={fechaHasta ? parseISO(fechaHasta) : undefined}
                            onSelect={(date) => setFechaHasta(date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] pl-1">Tipo de Movimiento</label>
                      <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
                        <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                          <SelectItem value="todos">Todos los movimientos</SelectItem>
                          <SelectItem value="ENTRADA">Entradas</SelectItem>
                          <SelectItem value="SALIDA">Salidas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-5 pt-4 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                    <Button variant="outline" onClick={limpiarFiltros} className="h-10 px-6 border-[#E5E7EB] dark:border-[#1F2937] hover:bg-[#F3F4F6] dark:hover:bg-white/5 rounded-[10px] text-[13px]">
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>

                {/* Tabla */}
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#F9FAFB] dark:bg-[#0A0F1E]">
                      <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                        <TableHead className="w-12 h-11"></TableHead>
                        <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">TIPO</TableHead>
                        <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">DETALLE</TableHead>
                        <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">FECHA</TableHead>
                        <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">RESPONSABLE</TableHead>
                        <TableHead className="text-right text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">ACCIONES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <Loader2 className="animate-spin h-6 w-6 mx-auto text-[#6B7280]" />
                          </TableCell>
                        </TableRow>
                      ) : movements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <History className="h-8 w-8 text-[#D1D5DB] dark:text-[#374151] mx-auto mb-3" />
                            <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">No se encontraron movimientos con los filtros actuales</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        movements.map((mov) => (
                          <>
                            <TableRow key={mov.idMovimiento} className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 border-[#E5E7EB] dark:border-[#1F2937] transition-colors group">
                              <TableCell className="py-3">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => toggleExpandRow(mov.idMovimiento)} 
                                  className="h-8 w-8 p-0 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  {expandedRows.has(mov.idMovimiento) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </TableCell>
                              <TableCell className="py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold ${mov.tipoMovimiento === "ENTRADA" ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20"}`}>
                                  {mov.tipoMovimiento === "ENTRADA" ? <ArrowUpCircle className="w-3 h-3 mr-1"/> : <ArrowDownCircle className="w-3 h-3 mr-1"/>}
                                  {mov.tipoMovimiento}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <p className="text-[13px] font-medium text-[#111827] dark:text-white line-clamp-1">{mov.motivo}</p>
                              </TableCell>
                              <TableCell className="py-3">
                                <div className="flex flex-col">
                                  <span className="text-[13px] text-[#111827] dark:text-white">{new Date(mov.fechaMovimiento).toLocaleDateString()}</span>
                                  <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{new Date(mov.fechaMovimiento).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="text-[13px] text-[#4B5563] dark:text-[#9CA3AF]">{mov.nombreUsuario}</span>
                              </TableCell>
                              <TableCell className="text-right py-3">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!isReadOnly && (
                                    <>
                                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(mov)} className="h-8 w-8 text-[#6B7280] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 rounded-md">
                                        <Edit className="h-4 w-4"/>
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => { setMovementToDelete(mov.idMovimiento); setDeleteDialogOpen(true); }} className="h-8 w-8 text-[#6B7280] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-md">
                                        <Trash2 className="h-4 w-4"/>
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedRows.has(mov.idMovimiento) && (
                              <TableRow className="bg-[#F9FAFB] dark:bg-[#0A0F1E]/30 hover:bg-[#F9FAFB] dark:hover:bg-[#0A0F1E]/30">
                                <TableCell colSpan={6} className="p-0 border-[#E5E7EB] dark:border-[#1F2937]">
                                  <div className="p-4 pl-14">
                                    <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl overflow-hidden shadow-sm">
                                      <Table>
                                        <TableHeader className="bg-[#F9FAFB] dark:bg-[#0A0F1E]/50">
                                          <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                                            <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[11px] h-9">PRODUCTO</TableHead>
                                            <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[11px] h-9 text-right">CANTIDAD</TableHead>
                                            <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[11px] h-9 text-right">PRECIO UNIT.</TableHead>
                                            <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[11px] h-9 text-right">SUBTOTAL</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {mov.detalles.map((det, idx) => (
                                            <TableRow key={idx} className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                                              <TableCell className="py-2 text-[12px] font-medium text-[#111827] dark:text-white">{det.nombreProducto}</TableCell>
                                              <TableCell className="text-right py-2 text-[12px] text-[#4B5563] dark:text-[#9CA3AF]">{det.cantidad}</TableCell>
                                              <TableCell className="text-right py-2 text-[12px] text-[#4B5563] dark:text-[#9CA3AF]">S/ {mov.tipoMovimiento === "ENTRADA" ? det.precioCompra : det.precioVenta}</TableCell>
                                              <TableCell className="text-right py-2 text-[12px] font-medium text-[#111827] dark:text-white">
                                                S/ {(det.cantidad * (mov.tipoMovimiento === "ENTRADA" ? det.precioCompra : det.precioVenta)).toFixed(2)}
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                          <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 hover:bg-transparent">
                                            <TableCell colSpan={3} className="text-right py-3 text-[12px] font-bold text-[#111827] dark:text-white">TOTAL GENERAL</TableCell>
                                            <TableCell className="text-right py-3 text-[13px] font-bold text-[#F97316]">
                                              S/ {mov.detalles.reduce((acc, d) => acc + (d.cantidad * (mov.tipoMovimiento === "ENTRADA" ? d.precioCompra : d.precioVenta)), 0).toFixed(2)}
                                            </TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </div>
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
      </div>

      {/* Modal de Edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-[#111827] dark:text-white">Modificar Movimiento</DialogTitle>
            <DialogDescription className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">
              Ajuste los detalles del movimiento. Tenga en cuenta que esto afectará el stock.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] pl-1">Tipo de Movimiento</label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SALIDA">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] pl-1">Responsable</label>
              <Select value={editResponsible} onValueChange={setEditResponsible}>
                <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                  {filteredUsers.map(u => (
                    <SelectItem key={u.idUsuario} value={u.idUsuario.toString()}>{u.nombre} {u.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative group input-wrapper mt-2">
              <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="peer h-[46px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-blue-500 rounded-[10px] transition-all duration-200" />
              <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left text-[13px]">
                Fecha
              </label>
            </div>
            <div className="relative group input-wrapper mt-2">
              <Input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="peer h-[46px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-blue-500 rounded-[10px] transition-all duration-200" />
              <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left text-[13px]">
                Hora
              </label>
            </div>
          </div>

          <div className="border-t border-[#E5E7EB] dark:border-[#1F2937] pt-4 mt-2">
            <h4 className="text-[14px] font-semibold text-[#111827] dark:text-white mb-3">Productos del Movimiento</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between h-[42px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px] font-normal text-[13px]">
                      {selectedProductToAdd ? selectedProductToAdd.nombreProducto : "Buscar producto a agregar..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                    <Command>
                      <CommandInput placeholder="Nombre..." onValueChange={setProductSearch} className="h-10 text-[13px]" />
                      <CommandList>
                        <CommandEmpty className="py-6 text-center text-[13px] text-[#6B7280]">No encontrado.</CommandEmpty>
                        <CommandGroup>
                          {foundProducts.map((product) => (
                            <CommandItem
                              key={product.idProducto}
                              value={product.nombreProducto}
                              onSelect={() => {
                                setSelectedProductToAdd(product);
                                setIsSearchOpen(false);
                              }}
                              className="text-[13px]"
                            >
                              <Check className={cn("mr-2 h-4 w-4 text-[#F97316]", selectedProductToAdd?.idProducto === product.idProducto ? "opacity-100" : "opacity-0")} />
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
                <Input type="number" placeholder="Cant." value={quantityToAdd} onChange={e => setQuantityToAdd(e.target.value)} className="h-[42px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]" />
              </div>
              <Button onClick={handleAddProductToEdit} className="h-[42px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[10px]">
                <Plus className="h-4 w-4"/>
              </Button>
            </div>
          </div>

          <div className="mt-4 border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F9FAFB] dark:bg-[#0A0F1E]">
                <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                  <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] h-9 text-[11px] font-medium">PRODUCTO</TableHead>
                  <TableHead className="text-right text-[#6B7280] dark:text-[#9CA3AF] h-9 text-[11px] font-medium">CANTIDAD</TableHead>
                  <TableHead className="w-10 h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-[13px] text-[#6B7280] py-4">Lista vacía (debe agregar productos)</TableCell>
                  </TableRow>
                ) : (
                  editProducts.map((p, idx) => (
                    <TableRow key={idx} className="border-[#E5E7EB] dark:border-[#1F2937]">
                      <TableCell className="text-[13px] font-medium">{p.nombre}</TableCell>
                      <TableCell className="text-right text-[13px]">
                        <div className="flex items-center justify-end gap-1.5 w-max ml-auto">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditProductQuantity(idx, p.cantidad - 1)}
                                disabled={p.cantidad <= 1}
                                className="w-7 h-7 rounded-full border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#111827] text-[#6B7280] hover:text-[#F97316] hover:border-[#F97316] hover:bg-[#F97316]/10 disabled:opacity-50"
                            >
                                <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                                type="text"
                                value={p.cantidad}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 1;
                                    handleEditProductQuantity(idx, val);
                                }}
                                className="w-[50px] text-center h-[28px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[6px] font-semibold text-[13px] px-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditProductQuantity(idx, p.cantidad + 1)}
                                className="w-7 h-7 rounded-full border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#111827] text-[#6B7280] hover:text-[#F97316] hover:border-[#F97316] hover:bg-[#F97316]/10"
                            >
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveProductFromEdit(idx)} className="h-7 w-7 p-0 text-[#6B7280] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md">
                          <Trash2 className="h-3.5 w-3.5"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-[#E5E7EB] dark:border-[#1F2937]">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="h-[42px] border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
              Cancelar
            </Button>
            <Button onClick={() => setSaveConfirmationOpen(true)} className="h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-[10px]">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmaciones */}
      <AlertDialog open={saveConfirmationOpen} onOpenChange={setSaveConfirmationOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] dark:text-white">¿Confirmar cambios?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
              Se revertirá el movimiento anterior (afectando el stock) y se aplicará el nuevo. Esta acción es irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E7EB] dark:border-[#1F2937]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] dark:text-white">¿Eliminar Movimiento?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
              El stock asociado a este movimiento será revertido (Entradas se restarán, Salidas se sumarán).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E7EB] dark:border-[#1F2937]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default Movements;