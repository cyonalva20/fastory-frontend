import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, FileText, ArrowLeft, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { format } from "date-fns";
import { apiRequest } from "@/api/apiClient";
import { ProductService, CategoriaFiltro } from "@/api/productService";

// Interfaz alineada con el DTO del Backend (ReporteDto)
interface ReporteInventarioItem {
    idProducto: number;
    codigo: string;
    nombreProducto: string;
    categoria: string;
    ubicacion: string;
    stockDisponible: number; // 🔹 CORREGIDO: Debe coincidir con el backend
    stockMinimo: number;
    precio: number;
    estado: string;
}

type SortField = "nombreProducto" | "categoria" | "stockDisponible" | "stockMinimo" | "ubicacion";

const CurrentInventoryReport = () => {
    const navigate = useNavigate();
    
    // Filtros
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    const [showLowStock, setShowLowStock] = useState(false);
    
    // Data
    const [products, setProducts] = useState<ReporteInventarioItem[]>([]);
    const [categorias, setCategorias] = useState<CategoriaFiltro[]>([]);
    const [loading, setLoading] = useState(false);

    // Ordenamiento
    const [sortField, setSortField] = useState<SortField>("nombreProducto");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // 1. Cargar categorías al inicio para el filtro
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

    // 2. Cargar datos del reporte cuando cambian los filtros
    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams();
                
                // Filtro Categoría
                if (selectedCategory !== "Todas") {
                    queryParams.append("categoriaId", selectedCategory);
                }
                
                // 🔹 NO enviamos stockBajoMinimo al backend - filtraremos en el frontend

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

        // Debounce para evitar muchas llamadas mientras se escribe la marca
        const timeoutId = setTimeout(() => {
            fetchReportData();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [selectedCategory]); // 🔹 showLowStock NO está aquí - solo filtra en el frontend

    // 🔹 Filtrado de stock bajo en el frontend
    const filteredProducts = showLowStock 
        ? products.filter(p => p.stockDisponible <= p.stockMinimo)
        : products;

    // Lógica de ordenamiento en cliente
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        // Manejo de valores nulos/undefined
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

        // Encabezado
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Inventario Actual", 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha de emisión: ${dateStr} - ${timeStr}`, 14, 28);
        doc.text("Fastory — Gestión Inteligente de Inventario", 14, 34);

        // Tabla
        const tableData = sortedProducts.map((product) => [
            product.nombreProducto,
            product.categoria,
            product.ubicacion || "Sin asignar",
            product.stockDisponible.toString(), // 🔹 CORREGIDO
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
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250],
            },
            didParseCell: (data) => {
                // Resaltar stock bajo en la columna de stock (índice 4)
                if (data.column.index === 4 && data.section === "body") {
                    const rowIndex = data.row.index;
                    const product = sortedProducts[rowIndex];
                    if (product && product.stockDisponible <= product.stockMinimo) { // 🔹 CORREGIDO
                        data.cell.styles.textColor = [220, 38, 38]; // Rojo
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
        <div className="min-h-screen bg-background flex">
            <div className="flex flex-1">
                <Sidebar activeSection="panel-principal" />

                <main className="flex-1 overflow-y-auto animate-fade-in">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                        
                        {/* Encabezado y Navegación */}
                        <div className="mb-6 lg:ml-0 ml-14">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/")}
                                        className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver al panel
                                    </Button>
                                    <h2 className="text-3xl font-bold text-foreground">Reporte de Inventario</h2>
                                </div>
                                <Button onClick={exportToPDF} className="gap-2 shadow-sm" disabled={products.length === 0}>
                                    <FileText className="h-4 w-4" /> Exportar PDF
                                </Button>
                            </div>

                            {/* Panel de Filtros */}
                            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                    {/* Categoría */}
                                    <div className="space-y-2">
                                        <Label>Categoría</Label>
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Todas">Todas</SelectItem>
                                                {categorias.map((cat) => (
                                                    <SelectItem key={cat.idCategoria} value={cat.idCategoria.toString()}>
                                                        {cat.nombreCategoria}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Stock Bajo */}
                                    <div className="flex items-center space-x-3 h-10 pb-1">
                                        <Switch
                                            id="low-stock"
                                            checked={showLowStock}
                                            onCheckedChange={setShowLowStock}
                                        />
                                        <Label htmlFor="low-stock" className="cursor-pointer font-medium">
                                            Solo Stock Bajo
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Resultados */}
                        <div className="lg:ml-0 ml-14 bg-card border rounded-xl shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort("nombreProducto")} className="h-8 p-0 font-bold hover:bg-transparent">
                                                Producto <ArrowUpDown className="ml-2 h-3 w-3" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort("categoria")} className="h-8 p-0 font-bold hover:bg-transparent">
                                                Categoría <ArrowUpDown className="ml-2 h-3 w-3" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort("ubicacion")} className="h-8 p-0 font-bold hover:bg-transparent">
                                                Ubicación <ArrowUpDown className="ml-2 h-3 w-3" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort("stockDisponible")} className="h-8 p-0 font-bold hover:bg-transparent">
                                                Stock <ArrowUpDown className="ml-2 h-3 w-3" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" onClick={() => handleSort("stockMinimo")} className="h-8 p-0 font-bold hover:bg-transparent">
                                                Mínimo <ArrowUpDown className="ml-2 h-3 w-3" />
                                            </Button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-32">
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p>Cargando inventario...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : sortedProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                No se encontraron productos con los filtros seleccionados
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedProducts.map((p) => (
                                            <TableRow key={p.idProducto} className="hover:bg-muted/30">
                                                <TableCell className="font-medium">{p.nombreProducto}</TableCell>
                                                <TableCell>{p.categoria}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                                        {p.ubicacion || "Sin Asignar"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`font-bold ${p.stockDisponible <= p.stockMinimo ? "text-destructive" : "text-foreground"}`}>
                                                        {p.stockDisponible}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{p.stockMinimo}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Resumen */}
                        {!loading && sortedProducts.length > 0 && (
                            <div className="mt-4 lg:ml-0 ml-14 text-sm text-muted-foreground flex gap-6">
                                <span>Total productos: <strong>{sortedProducts.length}</strong></span>
                                <span>Con stock bajo: <strong className="text-destructive">{sortedProducts.filter(p => p.stockDisponible <= p.stockMinimo).length}</strong></span>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
};

export default CurrentInventoryReport;