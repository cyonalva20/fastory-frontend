import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CalendarIcon, FileDown, ArrowUpDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportService, ProductoMasVendido } from "@/api/reportService";

// Extendemos la interfaz que viene del servicio para añadir el ranking en el frontend si es necesario
// aunque lo podemos calcular al vuelo (index + 1)
type SortField = "ranking" | "nombreProducto" | "categoria" | "cantidadVendida";

const TopSellingProducts = () => {
    const [dateFrom, setDateFrom] = useState<Date>();
    const [dateTo, setDateTo] = useState<Date>();
    const [reportGenerated, setReportGenerated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProductoMasVendido[]>([]);
    
    // Estado de ordenamiento
    const [sortField, setSortField] = useState<SortField>("cantidadVendida");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Validar fechas
    useEffect(() => {
        if (dateFrom && dateTo && dateFrom > dateTo) {
            toast.error("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'");
        }
    }, [dateFrom, dateTo]);

    const isDateRangeValid = dateFrom && dateTo && dateFrom <= dateTo;
    const isFormValid = isDateRangeValid;

    const handleGenerateReport = async () => {
        if (!isFormValid) return;

        setLoading(true);
        try {
            const fromStr = format(dateFrom, "yyyy-MM-dd");
            const toStr = format(dateTo, "yyyy-MM-dd");

            // Llamada al servicio real
            const data = await ReportService.getTopSelling(fromStr, toStr);

            if (data.length === 0) {
                toast.info("No hubo ventas en el periodo seleccionado");
            } else {
                toast.success("Reporte generado exitosamente");
            }

            setProducts(data);
            setReportGenerated(true);
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el reporte");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection(field === "cantidadVendida" ? "desc" : "asc");
        }
    };

    // Lógica de ordenamiento en cliente (útil si el usuario cambia el orden por columna)
    const sortedProducts = [...products].sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        
        // El ranking es implícito basado en la cantidad vendida original,
        // pero si ordenamos por otra cosa, el ranking visual cambiará o perderá sentido.
        // Para mantener la lógica simple:
        
        if (sortField === "cantidadVendida") {
            return (a.cantidadVendida - b.cantidadVendida) * multiplier;
        }
        if (sortField === "nombreProducto") {
            return a.nombreProducto.localeCompare(b.nombreProducto) * multiplier;
        }
        if (sortField === "categoria") {
            return a.categoria.localeCompare(b.categoria) * multiplier;
        }
        // Ranking (aproximación: usamos cantidad vendida inversa)
        if (sortField === "ranking") {
            return (b.cantidadVendida - a.cantidadVendida) * multiplier;
        }
        return 0;
    });

    const handleExportPDF = () => {
        if (!dateFrom || !dateTo) return;
        
        const doc = new jsPDF();
        const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
        const timeStr = format(new Date(), "HH:mm");

        // Encabezado
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Productos Más Vendidos", 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha de emisión: ${dateStr} - ${timeStr}`, 14, 28);
        doc.text(`Rango: ${format(dateFrom, "dd/MM/yyyy")} - ${format(dateTo, "dd/MM/yyyy")}`, 14, 34);

        // Datos de la tabla
        // Nota: Para el PDF, regeneramos el ranking basado en el orden actual o el original
        const tableData = sortedProducts.map((product, index) => [
            (index + 1).toString(), // Ranking relativo a la lista mostrada
            product.nombreProducto,
            product.categoria,
            product.cantidadVendida.toString()
        ]);

        autoTable(doc, {
            startY: 42,
            head: [["Ranking", "Producto", "Categoría", "Cantidad Vendida"]],
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
        });

        // Pie de página
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: "center" }
            );
        }

        const filename = `TopVentas_${format(dateFrom, "yyyy-MM-dd")}_${format(dateTo, "yyyy-MM-dd")}.pdf`;
        doc.save(filename);
        toast.success(`Exportando ${filename}...`);
    };

    return (
        <div className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal h-10",
                                    !dateFrom && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFrom ? format(dateFrom, "PPP", { locale: es }) : "Fecha Desde"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateFrom}
                                onSelect={setDateFrom}
                                initialFocus
                                className="pointer-events-auto"
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal h-10",
                                    !dateTo && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateTo ? format(dateTo, "PPP", { locale: es }) : "Fecha Hasta"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={dateTo}
                                onSelect={setDateTo}
                                initialFocus
                                className="pointer-events-auto"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Button
                    onClick={handleGenerateReport}
                    disabled={!isFormValid || loading}
                    className="sm:w-auto"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {loading ? "Generando..." : "Generar Reporte"}
                </Button>
            </div>

            {/* Área de resultados */}
            {!reportGenerated && !loading ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                        Seleccione un rango de fechas para ver los resultados
                    </p>
                </div>
            ) : products.length === 0 && reportGenerated ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">
                        No se encontraron productos vendidos en este periodo
                    </p>
                </div>
            ) : (
                <>
                    {/* Botones de exportación */}
                    <div className="flex justify-end gap-2 mb-4">
                        <Button variant="outline" onClick={handleExportPDF} className="gap-2" disabled={products.length === 0}>
                            <FileDown className="w-4 h-4" />
                            Exportar PDF
                        </Button>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("ranking")}
                                            className="font-semibold"
                                        >
                                            Ranking
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("nombreProducto")}
                                            className="font-semibold"
                                        >
                                            Producto
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("categoria")}
                                            className="font-semibold"
                                        >
                                            Categoría
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort("cantidadVendida")}
                                            className="font-semibold"
                                        >
                                            Cantidad Vendida
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedProducts.map((product, index) => (
                                    <TableRow key={index}>
                                        {/* Calculamos el ranking visualmente basado en el índice de la lista ordenada */}
                                        <TableCell className="font-medium text-center w-20">
                                            #{index + 1}
                                        </TableCell>
                                        <TableCell>{product.nombreProducto}</TableCell>
                                        <TableCell>{product.categoria}</TableCell>
                                        <TableCell className="font-semibold text-primary">
                                            {product.cantidadVendida}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}
        </div>
    );
};

export default TopSellingProducts;