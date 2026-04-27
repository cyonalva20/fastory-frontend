import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, FileText, ArrowLeft, Loader2, Filter, AlertTriangle, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { format } from "date-fns";
import { apiRequest } from "@/api/apiClient";
import { ProductService, CategoriaFiltro } from "@/api/productService";
import AppHeader from "@/components/AppHeader"; // <-- Import AppHeader

interface ReporteInventarioItem {
    idProducto: number;
    codigo: string;
    nombreProducto: string;
    categoria: string;
    ubicacion: string;
    stockDisponible: number;
    stockMinimo: number;
    precio: number;
    estado: string;
}

type SortField = "nombreProducto" | "categoria" | "stockDisponible" | "stockMinimo" | "ubicacion";

const CurrentInventoryReport = () => {
    const navigate = useNavigate();
    
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [showLowStock, setShowLowStock] = useState(false);
    
    const [products, setProducts] = useState<ReporteInventarioItem[]>([]);
    const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
    const [loading, setLoading] = useState(false);

    const [sortField, setSortField] = useState<SortField>("nombreProducto");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const data = await ProductService.getFiltrosInventario();
                setCategorias(data.categorias || []);
            } catch (error) {
                console.error("Error cargando categorías:", error);
                toast.error("Error al cargar filtros");
            }
        };
        fetchCategorias();
    }, []);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();
                
                if (selectedCategory !== "Todas") {
                    queryParams.append("categoriaId", selectedCategory);
                }
                
                const data = await apiRequest<ReporteInventarioItem[]>(
                    `/api/v1/reportes/stock-actual?${queryParams.toString()}`
                );

                setProducts(data || []);
            } catch (error) {
                console.error("Error fetching report:", error);
                toast.error("Error al cargar el inventario");
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchReportData();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [selectedCategory]);

    const filteredProducts = showLowStock 
        ? products.filter(p => p.stockDisponible <= p.stockMinimo)
        : products;

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        if (aValue == null) aValue = "";
        if (bValue == null) bValue = "";

        if (typeof aValue === "string") {
            return aValue.localeCompare(bValue) * multiplier;
        } else {
            return (aValue - bValue) * multiplier;
        }
    });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const now = new Date();
        const dateStr = format(now, "dd/MM/yyyy");
        const timeStr = format(now, "HH:mm");

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Inventario Actual", 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha de emisión: ${dateStr} - ${timeStr}`, 14, 28);
        doc.text("Fastory — Gestión Inteligente de Inventario", 14, 34);

        const tableData = sortedProducts.map((product) => [
            product.nombreProducto,
            product.categoria,
            product.ubicacion || "Sin asignar",
            product.stockDisponible.toString(),
            product.stockMinimo.toString(),
        ]);

        autoTable(doc, {
            startY: 42,
            head: [["Producto", "Categoría", "Ubicación", "Stock", "Mín."]],
            body: tableData,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [249, 115, 22], // Orange
                textColor: 255,
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250],
            },
            didParseCell: (data) => {
                if (data.column.index === 4 && data.section === "body") {
                    const rowIndex = data.row.index;
                    const product = sortedProducts[rowIndex];
                    if (product && product.stockDisponible <= product.stockMinimo) {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = "bold";
                    }
                }
            },
        });

        const filename = `inventario_actual_${format(now, "yyyy-MM-dd")}.pdf`;
        doc.save(filename);
        toast.success(`Exportando ${filename}...`);
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
                <Sidebar activeSection="reportes" />
                <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
                    <AppHeader sectionTitle="Reportes" />
                    
                    <main className="flex-1 overflow-y-auto animate-fade-in">
                        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
                            
                            {/* Encabezado */}
                            <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                                        Reporte de Inventario
                                    </h2>
                                    <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                                        Vista en tiempo real del estado de sus productos
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate("/")}
                                        className="h-10 px-4 border-[#E5E7EB] dark:border-[#1F2937] hover:bg-[#F3F4F6] dark:hover:bg-white/5 rounded-[10px] text-[13px] gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Volver
                                    </Button>
                                    <Button 
                                        onClick={exportToPDF} 
                                        disabled={products.length === 0}
                                        className="h-10 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] transition-all duration-200 rounded-[10px] font-semibold border-none gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> Exportar PDF
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-6 lg:ml-0 ml-14">
                                {/* Panel de Filtros */}
                                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F97316]" />
                                    <div className="flex items-center gap-2 mb-5">
                                        <Filter className="w-4 h-4 text-[#F97316]" />
                                        <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">Filtros del Reporte</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] pl-1">Categoría</label>
                                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                                <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                                                    <SelectValue placeholder="Todas" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                                                    <SelectItem value="Todas">Todas las Categorías</SelectItem>
                                                    {categorias.map((cat) => (
                                                        <SelectItem key={cat.idCategoria} value={cat.idCategoria.toString()}>
                                                            {cat.nombreCategoria}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center h-[46px] px-4 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                                            <Switch
                                                id="low-stock"
                                                checked={showLowStock}
                                                onCheckedChange={setShowLowStock}
                                                className="data-[state=checked]:bg-red-500"
                                            />
                                            <Label htmlFor="low-stock" className="ml-3 cursor-pointer text-[13px] font-medium text-[#111827] dark:text-white flex items-center gap-2">
                                                Solo mostrar stock bajo o crítico <AlertTriangle className="w-4 h-4 text-red-500" />
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla de Resultados */}
                                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-[#F9FAFB] dark:bg-[#0A0F1E]">
                                            <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                                                <TableHead>
                                                    <Button variant="ghost" onClick={() => handleSort("nombreProducto")} className="h-11 px-4 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] hover:bg-transparent hover:text-[#111827] dark:hover:text-white flex items-center w-full justify-start">
                                                        PRODUCTO <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button variant="ghost" onClick={() => handleSort("categoria")} className="h-11 px-4 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] hover:bg-transparent hover:text-[#111827] dark:hover:text-white flex items-center w-full justify-start">
                                                        CATEGORÍA <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button variant="ghost" onClick={() => handleSort("ubicacion")} className="h-11 px-4 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] hover:bg-transparent hover:text-[#111827] dark:hover:text-white flex items-center w-full justify-start">
                                                        UBICACIÓN <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button variant="ghost" onClick={() => handleSort("stockDisponible")} className="h-11 px-4 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] hover:bg-transparent hover:text-[#111827] dark:hover:text-white flex items-center w-full justify-start">
                                                        STOCK <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                                                    </Button>
                                                </TableHead>
                                                <TableHead>
                                                    <Button variant="ghost" onClick={() => handleSort("stockMinimo")} className="h-11 px-4 text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] hover:bg-transparent hover:text-[#111827] dark:hover:text-white flex items-center w-full justify-start">
                                                        MÍNIMO <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                                                    </Button>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-16">
                                                        <Loader2 className="h-8 w-8 animate-spin text-[#F97316] mx-auto mb-4" />
                                                        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">Cargando inventario...</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : sortedProducts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-16">
                                                        <FileText className="h-10 w-10 text-[#D1D5DB] dark:text-[#374151] mx-auto mb-3" />
                                                        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">No se encontraron productos con los filtros seleccionados</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                sortedProducts.map((p) => {
                                                    const isLowStock = p.stockDisponible <= p.stockMinimo;
                                                    return (
                                                        <TableRow key={p.idProducto} className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 border-[#E5E7EB] dark:border-[#1F2937] transition-colors">
                                                            <TableCell className="px-4 py-3 text-[13px] font-semibold text-[#111827] dark:text-white">{p.nombreProducto}</TableCell>
                                                            <TableCell className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">{p.categoria}</TableCell>
                                                            <TableCell className="px-4 py-3">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] dark:bg-white/10 text-[#4B5563] dark:text-white/80">
                                                                    {p.ubicacion || "Sin Asignar"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="px-4 py-3">
                                                                <span className={`inline-flex items-center gap-1.5 font-bold text-[14px] ${isLowStock ? "text-red-600 dark:text-red-400" : "text-[#10B981]"}`}>
                                                                    {p.stockDisponible}
                                                                    {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="px-4 py-3 text-[13px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">{p.stockMinimo}</TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                    
                                    {/* Resumen */}
                                    {!loading && sortedProducts.length > 0 && (
                                        <div className="bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-t border-[#E5E7EB] dark:border-[#1F2937] p-4 flex gap-8 items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium uppercase tracking-wider">Total Productos</span>
                                                    <span className="text-[15px] font-bold text-[#111827] dark:text-white">{sortedProducts.length}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium uppercase tracking-wider">Con Stock Crítico</span>
                                                    <span className="text-[15px] font-bold text-red-600 dark:text-red-400">
                                                        {sortedProducts.filter(p => p.stockDisponible <= p.stockMinimo).length}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default CurrentInventoryReport;