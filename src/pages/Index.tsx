import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRol } from "../hooks/useRol";
import Sidebar from "../components/Sidebar";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Search,
  ArrowUpDown,
  Loader2,
  Edit,
  AlertTriangle,
  FileBarChart,
  Package,
  AlertCircle,
  MapPin
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  ProductService,
  ProductoInventario,
  ProductoDetalle,
  LoteDetalle,
  CategoriaFiltro,
  RepisaFiltro,
  ProductoUpdatePayload,
  UbicacionDto,
} from "../api/productService";
import { Skeleton } from "../components/ui/skeleton";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

type SortField =
  | "nombre"
  | "categoria"
  | "precioCompra"
  | "precioVenta"
  | "stock"
  | "stockMinimo"
  | "ubicacion"
  | "proveedor";

const Index = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userRol, setUserRol] = useState<string | null>(null);
  const { isReadOnly } = useRol();

  // Estados de Datos
  const [products, setProducts] = useState<ProductoInventario[]>([]);
  const [stockAlerts, setStockAlerts] = useState<ProductoInventario[]>([]); // Estado para alertas
  const [allCategorias, setAllCategorias] = useState<CategoriaFiltro[]>([]);
  const [allRepisas, setAllRepisas] = useState<RepisaFiltro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Filtros
  const [searchName, setSearchName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchRepisa, setSearchRepisa] = useState("");
  const [searchFila, setSearchFila] = useState("");
  const [searchColumna, setSearchColumna] = useState("");

  // Estados de Ordenamiento
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Estados de Modal Ver Detalles
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<ProductoDetalle | null>(null);
  const [isViewDetailLoading, setIsViewDetailLoading] = useState(false);

  // Estados de Modal Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductoDetalle | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para confirmaciones
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showUbicacionOcupadaDialog, setShowUbicacionOcupadaDialog] =
    useState(false);
  const [productoOcupante, setProductoOcupante] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  // Estados para ubicaciones disponibles
  const [ubicacionesDisponibles, setUbicacionesDisponibles] = useState<
    UbicacionDto[]
  >([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // Estados del formulario de edición
  const [editForm, setEditForm] = useState({
    nombreProducto: "",
    descripcion: "",
    idCategoria: 0,
    precioCompra: 0,
    precioVenta: 0,
    stockMinimo: 0,
    idRepisa: 0,
    fila: 0,
    columna: 0,
  });

  // Errores de validación
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Efecto para autenticación
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
    } else {
      try {
        const userData = JSON.parse(user);
        if (!userData.username || !userData.id) {
          throw new Error("Datos de usuario incompletos");
        }
        setUserName(userData.username);
        setUserId(userData.id);
        setUserRol(userData.rol); // Aquí guardamos el rol en el estado
      } catch (e) {
        console.error("Error parsing user data", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/auth");
      }
    }
  }, [navigate]);

  // Cargar filtros
  useEffect(() => {
    const loadFiltros = async () => {
      try {
        const data = await ProductService.getFiltrosInventario();
        setAllCategorias(data.categorias || []);
        setAllRepisas(data.repisas || []);
      } catch (error) {
        console.error("Error fetching filtros:", error);
        toast.error("Error al cargar los filtros.");
      }
    };
    loadFiltros();
  }, []);

  // Cargar inventario y alertas
  const loadInventario = async () => {
    setIsLoading(true);
    try {
      const params = {
        nombre: searchName || undefined,
        categoriaId:
          selectedCategory === "Todas" ? undefined : parseInt(selectedCategory),
        repisa: searchRepisa || undefined,
        fila: searchFila ? parseInt(searchFila) : undefined,
        columna: searchColumna ? parseInt(searchColumna) : undefined,
        sortBy: sortField === "stock" ? "stockDisponible" : sortField,
        sortDir: sortDirection,
      };
      const data = await ProductService.getInventario(params);
      setProducts(data);

      // Cargar alertas de stock por separado
      const alertsData = await ProductService.getAlertasStock();
      setStockAlerts(alertsData);

    } catch (error) {
      console.error("Error fetching inventario:", error);
      toast.error("Error al cargar el inventario.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventario();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    searchName,
    selectedCategory,
    searchRepisa,
    searchFila,
    searchColumna,
    sortField,
    sortDirection,
  ]);

  // Filtros dependientes
  const repisaSeleccionada = useMemo(
    () => allRepisas.find((r) => r.codigo === searchRepisa),
    [allRepisas, searchRepisa]
  );

  const filas = useMemo(
    () =>
      repisaSeleccionada
        ? Array.from({ length: repisaSeleccionada.numeroFilas }, (_, i) =>
            (i + 1).toString()
          )
        : [],
    [repisaSeleccionada]
  );

  const columnas = useMemo(
    () =>
      repisaSeleccionada && searchFila
        ? Array.from({ length: repisaSeleccionada.numeroColumnas }, (_, i) =>
            (i + 1).toString()
          )
        : [],
    [repisaSeleccionada, searchFila]
  );

  // Filtros para el modal de edición
  const repisaEditSeleccionada = useMemo(
    () => allRepisas.find((r) => r.idRepisa === editForm.idRepisa),
    [allRepisas, editForm.idRepisa]
  );

  const filasEdit = useMemo(
    () =>
      repisaEditSeleccionada
        ? Array.from(
            { length: repisaEditSeleccionada.numeroFilas },
            (_, i) => i + 1
          )
        : [],
    [repisaEditSeleccionada]
  );

  const columnasEdit = useMemo(
    () =>
      repisaEditSeleccionada && editForm.fila
        ? Array.from(
            { length: repisaEditSeleccionada.numeroColumnas },
            (_, i) => i + 1
          )
        : [],
    [repisaEditSeleccionada, editForm.fila]
  );

  // Cargar ubicaciones cuando se selecciona una repisa
  useEffect(() => {
    if (editForm.idRepisa && isEditModalOpen) {
      loadUbicacionesDisponibles(editForm.idRepisa);
    }
  }, [editForm.idRepisa, isEditModalOpen]);

  const loadUbicacionesDisponibles = async (repisaId: number) => {
    setLoadingUbicaciones(true);
    try {
      const ubicaciones = await ProductService.getUbicacionesPorRepisa(
        repisaId
      );
      setUbicacionesDisponibles(ubicaciones);
    } catch (error) {
      console.error("Error loading ubicaciones:", error);
      toast.error("Error al cargar las ubicaciones de la repisa");
    } finally {
      setLoadingUbicaciones(false);
    }
  };

  // Verificar si una ubicación está disponible
  const isUbicacionDisponible = (fila: number, columna: number): boolean => {
    if (
      editProduct &&
      editProduct.fila === fila &&
      editProduct.columna === columna &&
      editProduct.idRepisa === editForm.idRepisa
    ) {
      return true;
    }

    const ubicacion = ubicacionesDisponibles.find(
      (u) => u.fila === fila && u.columna === columna
    );
    return ubicacion ? ubicacion.estado === "LIBRE" : false;
  };

  // Manejadores
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleClearFilters = () => {
    setSearchName("");
    setSelectedCategory("Todas");
    setSearchRepisa("");
    setSearchFila("");
    setSearchColumna("");
    setSortField("nombre");
    setSortDirection("asc");
  };

  const handleVerDetalles = async (id: number) => {
    setIsViewDetailLoading(true);
    setSelectedProductDetail(null);
    try {
      const data = await ProductService.getProductoDetalle(id);
      setSelectedProductDetail(data);
    } catch (error) {
      console.error("Error fetching product detail:", error);
      toast.error("Error al cargar los detalles del producto.");
    } finally {
      setIsViewDetailLoading(false);
    }
  };

  const handleOpenEdit = async (id: number) => {
    setIsEditLoading(true);
    setEditProduct(null);
    setFormErrors({});
    setIsEditModalOpen(true);
    setUbicacionesDisponibles([]);

    try {
      const data = await ProductService.getProductoDetalle(id);
      setEditProduct(data);
      setEditForm({
        nombreProducto: data.nombre,
        descripcion: data.descripcion || "",
        idCategoria: data.idCategoria,
        precioCompra: data.precioCompra,
        precioVenta: data.precioVenta,
        stockMinimo: data.stockMinimo,
        idRepisa: data.idRepisa || 0,
        fila: data.fila || 0,
        columna: data.columna || 0,
      });
    } catch (error) {
      console.error("Error loading product for edit:", error);
      toast.error("Error al cargar el producto para editar.");
      setIsEditModalOpen(false);
    } finally {
      setIsEditLoading(false);
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.nombreProducto.trim()) {
      errors.nombreProducto = "El nombre es obligatorio";
    } else if (editForm.nombreProducto.length > 100) {
      errors.nombreProducto = "El nombre no debe superar 100 caracteres";
    }

    if (editForm.descripcion && editForm.descripcion.length > 500) {
      errors.descripcion = "La descripción no debe superar 500 caracteres";
    }

    if (!editForm.idCategoria || editForm.idCategoria === 0) {
      errors.idCategoria = "Debe seleccionar una categoría";
    }

    if (!editForm.precioCompra || editForm.precioCompra <= 0) {
      errors.precioCompra = "El precio de compra debe ser mayor a cero";
    }

    if (!editForm.precioVenta || editForm.precioVenta <= 0) {
      errors.precioVenta = "El precio de venta debe ser mayor a cero";
    }

    if (!editForm.stockMinimo || editForm.stockMinimo <= 0) {
      errors.stockMinimo = "El stock mínimo debe ser mayor a cero";
    }

    const ubicacionCompleta =
      editForm.idRepisa && editForm.fila && editForm.columna;
    const ubicacionVacia =
      !editForm.idRepisa && !editForm.fila && !editForm.columna;

    if (!ubicacionCompleta && !ubicacionVacia) {
      errors.ubicacion =
        "Debe completar repisa, fila y columna, o dejar todos vacíos";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Iniciar proceso de guardado (muestra confirmación)
  const handleInitiateSave = () => {
    if (!validateForm()) {
      toast.error("Por favor corrija los errores en el formulario");
      return;
    }
    setShowConfirmSave(true);
  };

  // Guardar cambios (con opción de forzar ubicación)
  const handleSaveEdit = async (forzarCambioUbicacion: boolean = false) => {
    if (!editProduct) return;

    setIsSaving(true);
    try {
      const payload: ProductoUpdatePayload = {
        nombreProducto: editForm.nombreProducto.trim(),
        descripcion: editForm.descripcion.trim() || undefined,
        idCategoria: editForm.idCategoria,
        precioCompra: editForm.precioCompra,
        precioVenta: editForm.precioVenta,
        stockMinimo: editForm.stockMinimo,
        idRepisa: editForm.idRepisa || undefined,
        fila: editForm.fila || undefined,
        columna: editForm.columna || undefined,
        forzarCambioUbicacion, // Flag para manejar ubicación ocupada
      };

      await ProductService.updateProducto(editProduct.idProducto, payload);

      toast.success("Producto actualizado correctamente");
      setShowConfirmSave(false);
      setShowUbicacionOcupadaDialog(false);
      setIsEditModalOpen(false);
      loadInventario();
    } catch (error: any) {
      console.error("Error updating product:", error);

      // Manejar error de ubicación ocupada
      if (error.error === "UBICACION_OCUPADA") {
        setProductoOcupante({
          id: error.idProductoOcupante,
          nombre: error.nombreProductoOcupante,
        });
        setShowConfirmSave(false);
        setShowUbicacionOcupadaDialog(true);
      } else if (error.message?.includes("Ya existe")) {
        toast.error("Ya existe otro producto con ese nombre");
      } else if (error.message?.includes("autorizado")) {
        toast.error("No tiene permisos para realizar esta acción");
      } else {
        toast.error("Error al actualizar el producto");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar guardado sin ubicación (forzar cambio)
  const handleConfirmUbicacionOcupada = () => {
    handleSaveEdit(true); // Forzar el cambio de ubicación
  };

  // Renderizar tabla
  const renderTableBody = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-24 ml-auto" />
          </TableCell>
        </TableRow>
      ));
    }

    if (products.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={8}
            className="text-center py-8 text-muted-foreground"
          >
            No se encontraron productos que coincidan con los filtros
          </TableCell>
        </TableRow>
      );
    }

    return products.map((product) => (
      <TableRow
        key={product.idProducto}
        className="border-b border-border/30 hover:bg-accent/30 transition-colors"
      >
        <TableCell className="font-medium">{product.nombre}</TableCell>
        <TableCell>{product.categoria}</TableCell>
        <TableCell>{product.proveedor}</TableCell>
        <TableCell>
          {product.precioCompra?.toLocaleString("es-PE", {
            style: "currency",
            currency: "PEN",
          })}
        </TableCell>
        <TableCell>
          {product.precioVenta?.toLocaleString("es-PE", {
            style: "currency",
            currency: "PEN",
          })}
        </TableCell>
        <TableCell>
          <span
            className={`font-semibold ${
              product.stockDisponible < product.stockMinimo
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {product.stockDisponible}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {product.stockMinimo}
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
            {product.ubicacion}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex gap-2 justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleVerDetalles(product.idProducto)}
                >
                  Ver detalles
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-popover">
                {isViewDetailLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !selectedProductDetail ? (
                  <div className="text-center h-64 flex-col flex justify-center items-center">
                    <p className="text-destructive">
                      No se pudieron cargar los detalles.
                    </p>
                  </div>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>{selectedProductDetail.nombre}</DialogTitle>
                      <DialogDescription>
                        Información detallada del producto
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Categoría
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.categoria ?? "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Proveedor
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.proveedor ?? "N/A"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Descripción
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.descripcion ?? "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Precio Compra</p>
                        <p className="font-medium">
                          {selectedProductDetail.precioCompra?.toLocaleString(
                            "es-PE",
                            {
                              style: "currency",
                              currency: "PEN",
                            }
                          ) ?? "N/D"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Precio Venta</p>
                        <p className="font-medium">
                          {selectedProductDetail.precioVenta?.toLocaleString(
                            "es-PE",
                            {
                              style: "currency",
                              currency: "PEN",
                            }
                          ) ?? "N/D"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Stock disponible
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.stockDisponible}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Stock mínimo
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.stockMinimo}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Ubicación
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.ubicacion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Perecible
                        </p>
                        <p className="font-medium">
                          {selectedProductDetail.perecible ? "Sí" : "No"}
                        </p>
                      </div>
                      {selectedProductDetail.perecible && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Fecha de vencimiento (próxima)
                          </p>
                          <p className="font-medium">
                            {selectedProductDetail.fechaVencimientoProxima ??
                              "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold mt-2">Lotes</p>
                      {selectedProductDetail.lotes &&
                      selectedProductDetail.lotes.length > 0 ? (
                        <div className="mt-2 border rounded-md divide-y max-h-32 overflow-y-auto">
                          {selectedProductDetail.lotes.map((l: LoteDetalle) => (
                            <div
                              key={l.codigoLote}
                              className="p-2 text-sm flex items-center justify-between"
                            >
                              <span className="text-muted-foreground">
                                {l.codigoLote}
                              </span>
                              <span>Cant.: {l.cantidad}</span>
                              {selectedProductDetail.perecible && (
                                <span className="text-muted-foreground">
                                  Vence: {l.fechaVencimiento ?? "-"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Sin lotes registrados
                        </p>
                      )}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* 🔹 CONDICIONAL PARA EL BOTÓN MODIFICAR */}
            {!isReadOnly && (userRol === "Administrador" || userRol === "ADMINISTRADOR") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenEdit(product.idProducto)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modificar
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeSection="panel-principal" />
      <main className="flex-1 overflow-y-auto animate-fade-in">
        <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 max-w-[1600px] mx-auto">
          {/* Header row — title + report button on same line */}
          <div className="mb-4 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-outfit font-bold text-foreground">
                Inventario de Productos
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Busca y filtra productos por nombre, categoría o ubicación
              </p>
            </div>
            {(userRol === "Administrador" || userRol === "ADMINISTRADOR") && (
              <Button
                onClick={() => navigate("/reporte-inventario-actual")}
                className="gap-2 shrink-0"
                size="sm"
              >
                <FileBarChart className="h-4 w-4" />
                Reporte de Inventario
              </Button>
            )}
          </div>

          {/* Stock alerts — compact horizontal banner */}
          {stockAlerts.length > 0 && (
            <div className="mb-4 lg:ml-0 ml-14">
              <div className="bg-destructive/8 border border-destructive/20 rounded-lg px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      {stockAlerts.length} producto{stockAlerts.length !== 1 ? "s" : ""} con stock bajo mínimo
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {stockAlerts.map((p) => (
                        <span
                          key={p.idProducto}
                          className="inline-flex items-center gap-1.5 text-xs bg-background/60 border border-border/50 rounded-md px-2.5 py-1.5"
                          title={`Mínimo: ${p.stockMinimo} | Ubicación: ${p.ubicacion}`}
                        >
                          <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                          <span className="font-medium truncate max-w-[140px]">{p.nombre}</span>
                          <span className="font-mono font-bold text-destructive">{p.stockDisponible}</span>
                          <span className="text-muted-foreground">/ {p.stockMinimo}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters — compact single-row bar */}
          <div className="mb-4 lg:ml-0 ml-14">
            <div className="bg-card/60 border border-border/40 rounded-lg px-4 py-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px] max-w-[260px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Nombre del producto..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="min-w-[150px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoría</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todas</SelectItem>
                      {allCategorias.map((cat) => (
                        <SelectItem key={cat.idCategoria} value={cat.idCategoria.toString()}>
                          {cat.nombreCategoria} ({cat.cantidadProductos})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[120px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Repisa</label>
                  <Select
                    value={searchRepisa}
                    onValueChange={(v) => {
                      setSearchRepisa(v === "__all__" ? "" : v);
                      setSearchFila("");
                      setSearchColumna("");
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      {allRepisas.map((r) => (
                        <SelectItem key={r.idRepisa} value={r.codigo}>{r.codigo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[100px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Fila</label>
                  <Select
                    value={searchFila}
                    onValueChange={(v) => {
                      setSearchFila(v === "__all__" ? "" : v);
                      setSearchColumna("");
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm" disabled={!searchRepisa}>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      {filas.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[100px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Columna</label>
                  <Select
                    value={searchColumna}
                    onValueChange={(v) => setSearchColumna(v === "__all__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9 text-sm" disabled={!searchRepisa || !searchFila}>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todas</SelectItem>
                      {columnas.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 text-xs text-muted-foreground hover:text-foreground">
                  Limpiar
                </Button>
              </div>
            </div>
          </div>

          {/* Table — full width, dense */}
          <div className="lg:ml-0 ml-14">
            <div className="bg-card/60 border border-border/40 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/30 bg-muted/30">
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("nombre")} className="h-auto p-1.5 text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary">
                          Nombre <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("categoria")} className="h-auto p-1.5 text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary">
                          Categoría <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("proveedor")} className="h-auto p-1.5 text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary">
                          Proveedor <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("precioCompra")} className="h-auto p-1.5 text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary">
                          P. Compra <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("precioVenta")} className="h-auto p-1.5 text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary">
                          P. Venta <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("stock")} className="h-auto p-1.5 text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary">
                          Stock <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("stockMinimo")} className="h-auto p-1.5 text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary">
                          Mínimo <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort("ubicacion")} className="h-auto p-1.5 text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary">
                          Ubicación <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderTableBody()}</TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-popover max-h-[90vh] overflow-y-auto">
          {isEditLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !editProduct ? (
            <div className="text-center h-64 flex-col flex justify-center items-center">
              <p className="text-destructive">
                No se pudieron cargar los datos del producto.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Modificar Producto</DialogTitle>
                <DialogDescription>
                  Edita los campos modificables del producto
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nombre">
                    Nombre del Producto{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-nombre"
                    value={editForm.nombreProducto}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        nombreProducto: e.target.value,
                      })
                    }
                    placeholder="Ej: Arroz Costeño 1kg"
                    className={
                      formErrors.nombreProducto ? "border-destructive" : ""
                    }
                  />
                  {formErrors.nombreProducto && (
                    <p className="text-sm text-destructive">
                      {formErrors.nombreProducto}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-descripcion">Descripción</Label>
                  <Textarea
                    id="edit-descripcion"
                    value={editForm.descripcion}
                    onChange={(e) =>
                      setEditForm({ ...editForm, descripcion: e.target.value })
                    }
                    placeholder="Descripción del producto..."
                    rows={3}
                    className={
                      formErrors.descripcion ? "border-destructive" : ""
                    }
                  />
                  {formErrors.descripcion && (
                    <p className="text-sm text-destructive">
                      {formErrors.descripcion}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-categoria">
                    Categoría <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={editForm.idCategoria.toString()}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, idCategoria: parseInt(v) })
                    }
                  >
                    <SelectTrigger
                      id="edit-categoria"
                      className={
                        formErrors.idCategoria ? "border-destructive" : ""
                      }
                    >
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategorias.map((cat) => (
                        <SelectItem
                          key={cat.idCategoria}
                          value={cat.idCategoria.toString()}
                        >
                          {cat.nombreCategoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.idCategoria && (
                    <p className="text-sm text-destructive">
                      {formErrors.idCategoria}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-precio-compra">
                      Precio Compra (S/) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-precio-compra"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editForm.precioCompra}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          precioCompra: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className={formErrors.precioCompra ? "border-destructive" : ""}
                    />
                    {formErrors.precioCompra && (
                      <p className="text-sm text-destructive">
                        {formErrors.precioCompra}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-precio-venta">
                      Precio Venta (S/) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-precio-venta"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editForm.precioVenta}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          precioVenta: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className={formErrors.precioVenta ? "border-destructive" : ""}
                    />
                    {formErrors.precioVenta && (
                      <p className="text-sm text-destructive">
                        {formErrors.precioVenta}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-stock-minimo">
                      Stock Mínimo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-stock-minimo"
                      type="number"
                      min="1"
                      value={editForm.stockMinimo}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          stockMinimo: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className={
                        formErrors.stockMinimo ? "border-destructive" : ""
                      }
                    />
                    {formErrors.stockMinimo && (
                      <p className="text-sm text-destructive">
                        {formErrors.stockMinimo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Ubicación</Label>
                    {loadingUbicaciones && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-repisa">Repisa</Label>
                    <Select
                      value={
                        editForm.idRepisa ? editForm.idRepisa.toString() : "0"
                      }
                      onValueChange={(v) => {
                        const idRepisa = parseInt(v);
                        setEditForm({
                          ...editForm,
                          idRepisa,
                          fila: 0,
                          columna: 0,
                        });
                      }}
                    >
                      <SelectTrigger id="edit-repisa">
                        <SelectValue placeholder="Seleccionar repisa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sin ubicación</SelectItem>
                        {allRepisas.map((r) => (
                          <SelectItem
                            key={r.idRepisa}
                            value={r.idRepisa.toString()}
                          >
                            {r.codigo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-fila">Fila</Label>
                      <Select
                        value={editForm.fila ? editForm.fila.toString() : "0"}
                        onValueChange={(v) => {
                          setEditForm({
                            ...editForm,
                            fila: parseInt(v),
                            columna: 0,
                          });
                        }}
                        disabled={!editForm.idRepisa}
                      >
                        <SelectTrigger id="edit-fila">
                          <SelectValue placeholder="Seleccionar fila" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">---</SelectItem>
                          {filasEdit.map((f) => (
                            <SelectItem key={f} value={f.toString()}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-columna">Columna</Label>
                      <Select
                        value={
                          editForm.columna ? editForm.columna.toString() : "0"
                        }
                        onValueChange={(v) => {
                          setEditForm({
                            ...editForm,
                            columna: parseInt(v),
                          });
                        }}
                        disabled={!editForm.idRepisa || !editForm.fila}
                      >
                        <SelectTrigger id="edit-columna">
                          <SelectValue placeholder="Seleccionar columna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">---</SelectItem>
                          {columnasEdit.map((c) => {
                            const disponible = isUbicacionDisponible(
                              editForm.fila,
                              c
                            );
                            return (
                              <SelectItem
                                key={c}
                                value={c.toString()}
                                disabled={!disponible}
                              >
                                {c} {!disponible && "(Ocupada)"}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formErrors.ubicacion && (
                    <p className="text-sm text-destructive">
                      {formErrors.ubicacion}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Deje todos los campos de ubicación vacíos para no modificar
                    la ubicación actual
                  </p>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Información no modificable:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock Disponible:</p>
                      <p className="font-medium">
                        {editProduct.stockDisponible}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ubicación Actual:</p>
                      <p className="font-medium">{editProduct.ubicacion}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Proveedor:</p>
                      <p className="font-medium">{editProduct.proveedor}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Perecible:</p>
                      <p className="font-medium">
                        {editProduct.perecible ? "Sí" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleInitiateSave} disabled={isSaving}>
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog - Confirmación de Guardado */}
      <AlertDialog open={showConfirmSave} onOpenChange={setShowConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Cambios
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará los datos del producto permanentemente. ¿Está
              seguro de que desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSaveEdit(false)}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog - Ubicación Ocupada */}
      <AlertDialog
        open={showUbicacionOcupadaDialog}
        onOpenChange={setShowUbicacionOcupadaDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Ubicación Ocupada
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                La ubicación seleccionada está ocupada por el producto:{" "}
                <span className="font-semibold text-foreground">
                  {productoOcupante?.nombre}
                </span>
              </p>
              <p className="text-destructive font-medium">
                ¿Desea dejar ese producto sin ubicación asignada y continuar?
              </p>
              <p className="text-xs text-muted-foreground border-l-2 border-amber-500 pl-3 py-2 bg-amber-50 dark:bg-amber-950/20">
                <strong>Recomendación:</strong> Se recomienda asignarle una
                ubicación al producto desplazado cuanto antes para mantener el
                orden del inventario.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUbicacionOcupada}
              disabled={isSaving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Sí, continuar sin ubicación"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
