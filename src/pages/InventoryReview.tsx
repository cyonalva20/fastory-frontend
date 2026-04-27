import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Loader2, ClipboardCheck, History, Filter, Plus, Minus } from "lucide-react";
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
import { ProductService, ProductoInventario, RepisaFiltro } from "@/api/productService";
import { MovimientoService, MovimientoHistorialDto } from "@/api/movimientoService";
import AppHeader from "@/components/AppHeader"; // <-- Import AppHeader

const InventoryReview = () => {
    const [products, setProducts] = useState<ProductoInventario[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductoInventario[]>([]);
    const [stockReal, setStockReal] = useState<{ [key: number]: string }>({});
    const [adjustmentHistory, setAdjustmentHistory] = useState<MovimientoHistorialDto[]>([]);
    const [repisas, setRepisas] = useState<RepisaFiltro[]>([]);
    const [selectedShelf, setSelectedShelf] = useState<string>("all");
    const [pendingAdjustment, setPendingAdjustment] = useState<ProductoInventario | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    useEffect(() => {
        loadProducts();
        loadRepisas();
        loadHistory();
    }, []);

    useEffect(() => {
        if (selectedShelf === "all") {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p => 
                p.ubicacion && p.ubicacion.startsWith(selectedShelf)
            ));
        }
    }, [selectedShelf, products]);

    const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const data = await ProductService.getInventario({});
            setProducts(data);
        } catch (error) {
            toast.error("Error al cargar inventario");
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const loadRepisas = async () => {
        try {
            const data = await ProductService.getFiltrosInventario();
            setRepisas(data.repisas);
        } catch (error) {
            console.error("Error cargando repisas");
        }
    };

    const loadHistory = async () => {
        try {
            const data = await MovimientoService.obtenerHistorialAjustes();
            setAdjustmentHistory(data);
        } catch (error) {
            console.error("Error cargando historial");
        }
    };

    const handleStockRealChange = (productId: number, value: string) => {
        setStockReal(prev => ({
            ...prev,
            [productId]: value
        }));
    };

    const handleStockIncrement = (productId: number, currentStock: string | undefined) => {
        const currentVal = parseInt(currentStock || "0") || 0;
        handleStockRealChange(productId, (currentVal + 1).toString());
    };

    const handleStockDecrement = (productId: number, currentStock: string | undefined) => {
        const currentVal = parseInt(currentStock || "0") || 0;
        if (currentVal > 0) {
            handleStockRealChange(productId, (currentVal - 1).toString());
        }
    };

    const initiateAdjustment = (product: ProductoInventario) => {
        const val = stockReal[product.idProducto];
        const newStock = parseInt(val || "");

        if (isNaN(newStock) || newStock < 0) {
            toast.error("Por favor ingrese un valor numérico válido (positivo o cero)");
            return;
        }

        if (newStock === product.stockDisponible) {
            toast.info("El stock real es igual al stock registrado. No se requieren cambios.");
            return;
        }

        setPendingAdjustment(product);
        setIsDialogOpen(true);
    };

    const handleConfirmAdjustment = async () => {
        if (!pendingAdjustment) return;

        const productId = pendingAdjustment.idProducto;
        const newStock = parseInt(stockReal[productId]);

        try {
            await MovimientoService.registrarAjuste({
                idProducto: productId,
                stockReal: newStock
            });

            toast.success(`Stock de "${pendingAdjustment.nombre}" actualizado a ${newStock}`);
            
            setPendingAdjustment(null);
            setIsDialogOpen(false);
            setStockReal(prev => {
                const next = { ...prev };
                delete next[productId];
                return next;
            });
            
            loadProducts();
            loadHistory();

        } catch (error: any) {
            const msg = error.message || "Error al realizar el ajuste";
            toast.error(msg);
        }
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
                <Sidebar activeSection="revision-inventario" />
                
                <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
                    <AppHeader sectionTitle="Revisión Inventario" />

                    <main className="flex-1 overflow-y-auto animate-fade-in">
                        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
                            
                            <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                                        Revisión Periódica de Inventario
                                    </h2>
                                    <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                                        Verifica y ajusta el stock físico para que coincida con el sistema
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px] pl-3 h-10 w-[260px] shadow-sm">
                                        <Filter className="w-4 h-4 text-[#9CA3AF]" />
                                        <Select value={selectedShelf} onValueChange={setSelectedShelf}>
                                            <SelectTrigger className="border-none bg-transparent shadow-none h-full focus:ring-0 focus:ring-offset-0">
                                                <SelectValue placeholder="Filtrar por repisa" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                                                <SelectItem value="all">Todas las repisas</SelectItem>
                                                {repisas.map(r => (
                                                    <SelectItem key={r.idRepisa} value={r.codigo}>
                                                        Repisa {r.codigo}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 lg:ml-0 ml-14">
                                {/* Tabla de Inventario */}
                                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm overflow-hidden relative">
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F97316]" />
                                    
                                    <div className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                                        <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center">
                                                <ClipboardCheck className="w-4 h-4 text-[#F97316]" />
                                            </div>
                                            Productos en Inventario
                                        </h3>
                                    </div>

                                    <Table>
                                        <TableHeader className="bg-[#F9FAFB] dark:bg-[#0A0F1E]">
                                            <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                                                <TableHead className="h-11 px-6 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">PRODUCTO</TableHead>
                                                <TableHead className="h-11 px-6 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">CATEGORÍA</TableHead>
                                                <TableHead className="h-11 px-6 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">UBICACIÓN</TableHead>
                                                <TableHead className="h-11 px-6 text-right text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">STOCK SISTEMA</TableHead>
                                                <TableHead className="h-11 px-6 text-center text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">STOCK REAL</TableHead>
                                                <TableHead className="h-11 px-6 text-center text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">ACCIÓN</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingProducts ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-16">
                                                        <Loader2 className="h-8 w-8 animate-spin text-[#F97316] mx-auto mb-4" />
                                                        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">Cargando inventario...</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredProducts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-16">
                                                        <ClipboardCheck className="h-10 w-10 text-[#D1D5DB] dark:text-[#374151] mx-auto mb-3" />
                                                        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">No se encontraron productos.</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredProducts.map((product) => (
                                                    <TableRow key={product.idProducto} className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 border-[#E5E7EB] dark:border-[#1F2937] transition-colors">
                                                        <TableCell className="px-6 py-4 font-semibold text-[13px] text-[#111827] dark:text-white">{product.nombre}</TableCell>
                                                        <TableCell className="px-6 py-4 text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">{product.categoria}</TableCell>
                                                        <TableCell className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] dark:bg-white/10 text-[#4B5563] dark:text-white/80">
                                                                {product.ubicacion || "N/A"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 text-right">
                                                            <span className="font-bold text-[14px] text-[#111827] dark:text-white">{product.stockDisponible}</span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5 w-max mx-auto">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleStockDecrement(product.idProducto, stockReal[product.idProducto])}
                                                                    className="w-8 h-8 rounded-full border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#111827] text-[#6B7280] hover:text-[#F97316] hover:border-[#F97316] hover:bg-[#F97316]/10"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Input
                                                                    type="text"
                                                                    placeholder="0"
                                                                    value={stockReal[product.idProducto] || ""}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                                        handleStockRealChange(product.idProducto, val);
                                                                    }}
                                                                    className="w-[60px] text-center h-[36px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[8px] font-semibold text-[14px]"
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleStockIncrement(product.idProducto, stockReal[product.idProducto])}
                                                                    className="w-8 h-8 rounded-full border-[#E5E7EB] dark:border-[#1F2937] bg-white dark:bg-[#111827] text-[#6B7280] hover:text-[#F97316] hover:border-[#F97316] hover:bg-[#F97316]/10"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 text-center">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => initiateAdjustment(product)}
                                                                disabled={!stockReal[product.idProducto]}
                                                                className="h-[38px] px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-[8px] font-semibold border-none gap-2 shadow-[0_4px_15px_rgba(249,115,22,0.35)] disabled:opacity-50 disabled:shadow-none"
                                                            >
                                                                <Save className="w-3.5 h-3.5" />
                                                                Ajustar
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Historial de Ajustes */}
                                {adjustmentHistory.length > 0 && (
                                    <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm overflow-hidden relative mt-6">
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
                                        
                                        <div className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                                            <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                                    <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                Historial de Últimos Ajustes
                                            </h3>
                                        </div>

                                        <Table>
                                            <TableHeader className="bg-[#F9FAFB] dark:bg-[#0A0F1E]">
                                                <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                                                    <TableHead className="h-11 px-6 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">PRODUCTO</TableHead>
                                                    <TableHead className="h-11 px-6 text-right text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">STOCK ANTERIOR</TableHead>
                                                    <TableHead className="h-11 px-6 text-right text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">STOCK CORREGIDO</TableHead>
                                                    <TableHead className="h-11 px-6 text-right text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">DIFERENCIA</TableHead>
                                                    <TableHead className="h-11 px-6 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">MOTIVO / DETALLE</TableHead>
                                                    <TableHead className="h-11 px-6 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">FECHA</TableHead>
                                                    <TableHead className="h-11 px-6 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px]">USUARIO</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {adjustmentHistory.map((hist, index) => {
                                                    const detalle = hist.detalles[0];
                                                    const stockAnterior = detalle?.stockAnterior ?? "N/A";
                                                    const stockNuevo = detalle?.stockNuevo ?? "N/A";
                                                    const diferencia = detalle?.cantidad ?? 0;
                                                    const isPositive = hist.motivo.includes("Sobrante");
                                                    
                                                    if(!detalle) return null;

                                                    return (
                                                        <TableRow key={index} className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 border-[#E5E7EB] dark:border-[#1F2937] transition-colors">
                                                            <TableCell className="px-6 py-4 font-medium text-[13px] text-[#111827] dark:text-white">{detalle.nombreProducto}</TableCell>
                                                            <TableCell className="px-6 py-4 text-right text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">{stockAnterior}</TableCell>
                                                            <TableCell className="px-6 py-4 text-right font-bold text-[13px] text-[#111827] dark:text-white">{stockNuevo}</TableCell>
                                                            <TableCell className={`px-6 py-4 text-right font-bold text-[13px] ${isPositive ? 'text-[#10B981]' : 'text-red-500'}`}>
                                                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full ${isPositive ? 'bg-[#10B981]/10' : 'bg-red-500/10'}`}>
                                                                    {isPositive ? '+' : '-'}{diferencia}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4 text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">{hist.motivo}</TableCell>
                                                            <TableCell className="px-6 py-4 text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">{new Date(hist.fechaMovimiento).toLocaleString()}</TableCell>
                                                            <TableCell className="px-6 py-4 text-[13px] text-[#4B5563] dark:text-[#9CA3AF]">{hist.nombreUsuario}</TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>

                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <AlertDialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-[#111827] dark:text-white">¿Confirmar ajuste de inventario?</AlertDialogTitle>
                            <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                                Se actualizará el stock de <strong className="text-[#111827] dark:text-white">{pendingAdjustment?.nombre}</strong> de {" "}
                                <span className="font-bold text-[#111827] dark:text-white">{pendingAdjustment?.stockDisponible}</span> a {" "}
                                <span className="font-bold text-[#111827] dark:text-white">{pendingAdjustment && stockReal[pendingAdjustment.idProducto]}</span> unidades.
                                <br /><br />
                                Esta acción quedará registrada en el historial y afectará los lotes correspondientes.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 border-t border-[#E5E7EB] dark:border-[#1F2937] pt-4">
                            <AlertDialogCancel onClick={() => setPendingAdjustment(null)} className="border-[#E5E7EB] dark:border-[#1F2937]">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmAdjustment} className="bg-blue-600 hover:bg-blue-700 text-white">Confirmar Ajuste</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </SidebarProvider>
    );
};

export default InventoryReview;