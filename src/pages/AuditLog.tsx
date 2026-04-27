import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Shield, Search, Loader2, Eye, User, FileText, Clock, ArrowUpCircle, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { AuditoriaService, AuditoriaDto } from "@/api/auditoriaService";
import { UserService, UserDto } from "@/api/userService";

const accionConfig: Record<string, { label: string; color: string; icon: any }> = {
  CREAR: { label: "Creado", color: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20", icon: ArrowUpCircle },
  MODIFICAR: { label: "Modificado", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Pencil },
  ELIMINAR: { label: "Eliminado", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: Trash2 },
};

const AuditLog = () => {
  const [records, setRecords] = useState<AuditoriaDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAccion, setFilterAccion] = useState("todas");
  const [filterUsuario, setFilterUsuario] = useState("todos");
  const [detailRecord, setDetailRecord] = useState<AuditoriaDto | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [auditData, usersData] = await Promise.all([
        AuditoriaService.obtenerTodas(),
        UserService.list(),
      ]);
      setRecords(auditData);
      setUsers(usersData);
    } catch {
      toast.error("Error al cargar registros de auditoría");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterByUser = async (userId: string) => {
    setFilterUsuario(userId);
    if (userId === "todos") { fetchData(); return; }
    setIsLoading(true);
    try {
      const data = await AuditoriaService.obtenerPorUsuario(parseInt(userId));
      setRecords(data);
    } catch { toast.error("Error al filtrar"); } finally { setIsLoading(false); }
  };

  const getUserName = (idUsuario: number) => {
    const u = users.find((u) => u.idUsuario === idUsuario);
    return u ? `${u.nombre} ${u.apellido}` : `Usuario #${idUsuario}`;
  };

  const filtered = records.filter((r) => {
    const matchAccion = filterAccion === "todas" || r.accion === filterAccion;
    const matchSearch = searchTerm === "" ||
      r.tablaAfectada.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(r.idUsuario).toLowerCase().includes(searchTerm.toLowerCase());
    return matchAccion && matchSearch;
  });

  const toggleExpand = (id: number) => {
    const n = new Set(expandedRows);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpandedRows(n);
  };

  const parseJson = (s: string | null) => {
    if (!s) return null;
    try { return JSON.parse(s); } catch { return null; }
  };

  const getMotivo = (rec: AuditoriaDto) => {
    const data = parseJson(rec.datosNuevos) || parseJson(rec.datosAnteriores);
    return data?.motivo || "—";
  };

  const renderPrettyData = (dataStr: string | null, colorClass: string, auditDateStr: string | null = null, isAnterior: boolean = false) => {
    const data = parseJson(dataStr);
    if (!data) return null;
    
    const ignoredKeys = ["idusuario", "idresponsable", "idmovimiento", "tipomovimiento", "estado", "fechamovimiento", "fecha", "hora", "idproducto", "motivo"];
    
    const keyLabels: Record<string, string> = {
      motivo: "Motivo",
      detalles: "Detalles",
      nombreproducto: "Producto",
      cantidad: "Cantidad",
      preciocompra: "Precio Compra",
      precioventa: "Precio Venta"
    };

    const getLabel = (k: string) => keyLabels[k.toLowerCase()] || k;

    // Buscar si hay alguna fecha de movimiento en los datos (puede venir con diferentes casing)
    const rawFechaKey = Object.keys(data).find(k => k.toLowerCase() === 'fechamovimiento' || k.toLowerCase() === 'fecha');
    const rawFechaMovimiento = rawFechaKey ? data[rawFechaKey] : null;

    const renderValue = (val: any): React.ReactNode => {
      if (Array.isArray(val)) {
        return (
          <div className="flex flex-col gap-1.5 mt-1.5 w-full">
            {val.map((item, idx) => (
              <div key={idx} className="bg-[#F3F4F6] dark:bg-[#1F2937]/50 rounded-md p-2.5 text-[11px] space-y-1.5 w-full border border-[#E5E7EB] dark:border-[#374151]">
                {Object.entries(item)
                  .filter(([ik]) => !ignoredKeys.includes(ik.toLowerCase()))
                  .map(([ik, iv]) => (
                  <div key={ik} className="flex justify-between items-center gap-4">
                    <span className="text-[#6B7280] dark:text-[#9CA3AF] capitalize">{getLabel(ik)}</span>
                    <span className={`font-semibold text-right break-all ${colorClass}`}>{iv !== null ? String(iv) : "—"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      } else if (typeof val === 'object' && val !== null) {
        return (
          <div className="bg-[#F3F4F6] dark:bg-[#1F2937]/50 rounded-md p-2.5 text-[11px] space-y-1.5 w-full mt-1.5 border border-[#E5E7EB] dark:border-[#374151]">
            {Object.entries(val)
              .filter(([ik]) => !ignoredKeys.includes(ik.toLowerCase()))
              .map(([ik, iv]) => (
              <div key={ik} className="flex justify-between items-center gap-4">
                <span className="text-[#6B7280] dark:text-[#9CA3AF] capitalize">{getLabel(ik)}</span>
                <span className={`font-semibold text-right break-all ${colorClass}`}>{iv !== null ? String(iv) : "—"}</span>
              </div>
            ))}
          </div>
        );
      }
      return <span className={`text-[12px] font-bold ${colorClass} break-all text-right`}>{val !== null ? String(val) : "—"}</span>;
    };

    return (
      <div className="flex flex-col gap-2">
        {isAnterior && rawFechaMovimiento && (
          <div className="flex items-center justify-between bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-lg px-3.5 py-2.5 shadow-sm">
            <span className="text-[11px] font-bold text-[#4B5563] dark:text-[#D1D5DB] uppercase tracking-wide shrink-0">Fecha del Movimiento</span>
            <div className="flex-1 flex justify-end ml-4 text-right">
              <span className={`text-[12px] font-bold ${colorClass} break-all`}>
                {new Date(rawFechaMovimiento).toLocaleString()}
              </span>
            </div>
          </div>
        )}
        
        {!isAnterior && auditDateStr && (
          <div className="flex items-center justify-between bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-lg px-3.5 py-2.5 shadow-sm">
            <span className="text-[11px] font-bold text-[#4B5563] dark:text-[#D1D5DB] uppercase tracking-wide shrink-0">Fecha de Modificación</span>
            <div className="flex-1 flex justify-end ml-4 text-right">
              <span className={`text-[12px] font-bold ${colorClass} break-all`}>
                {new Date(auditDateStr).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {Object.entries(data)
          .filter(([k]) => !ignoredKeys.includes(k.toLowerCase()))
          .map(([k, v], i) => (
          <div key={i} className={`flex ${typeof v === 'object' && v !== null ? 'flex-col items-start' : 'items-center justify-between'} bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-lg px-3.5 py-2.5 shadow-sm`}>
            <span className="text-[11px] font-bold text-[#4B5563] dark:text-[#D1D5DB] uppercase tracking-wide shrink-0">{getLabel(k)}</span>
            <div className={`${typeof v === 'object' && v !== null ? 'w-full' : 'flex-1 flex justify-end ml-4'}`}>
              {renderValue(v)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderJsonDiff = (antes: any, despues: any) => {
    if (!antes && !despues) return <p className="text-[13px] text-[#6B7280]">Sin datos</p>;
    const ignoredKeys = ["idusuario", "idresponsable", "idmovimiento", "tipomovimiento", "estado", "fechamovimiento", "fecha", "hora", "idproducto", "motivo"];
    const allKeys = new Set([...Object.keys(antes || {}), ...Object.keys(despues || {})]);
    return (
      <div className="space-y-2">
        {[...allKeys].filter(k => k !== "detalles" && !ignoredKeys.includes(k.toLowerCase())).map((key) => {
          const a = antes?.[key], d = despues?.[key];
          const changed = JSON.stringify(a) !== JSON.stringify(d);
          if (!changed && antes && despues) return null;
          return (
            <div key={key} className={`flex items-start gap-3 text-[12px] px-3 py-1.5 rounded-lg ${changed ? "bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10" : ""}`}>
              <span className="font-semibold text-[#6B7280] dark:text-[#9CA3AF] w-36 shrink-0 uppercase text-[11px]">{key}</span>
              {antes && <span className="text-red-500 line-through flex-1 break-all">{a != null ? String(a) : "—"}</span>}
              {despues && <span className="text-[#10B981] flex-1 break-all">{d != null ? String(d) : "—"}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="auditoria" />
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle="Auditoría" />
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">

              <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    Registro de Auditoría
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    Historial de cambios realizados en los movimientos de inventario
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[12px] font-semibold text-[#10B981]">{filtered.length} registros</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5 lg:ml-0 ml-14">
                {/* Filtros */}
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#F97316] to-[#EA580C]" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <Input
                        placeholder="Buscar por tabla o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Select value={filterAccion} onValueChange={setFilterAccion}>
                        <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                          <SelectValue placeholder="Tipo de acción" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                          <SelectItem value="todas">Todas las acciones</SelectItem>
                          <SelectItem value="CREAR">Crear</SelectItem>
                          <SelectItem value="MODIFICAR">Modificar</SelectItem>
                          <SelectItem value="ELIMINAR">Eliminar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Select value={filterUsuario} onValueChange={handleFilterByUser}>
                        <SelectTrigger className="h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                          <SelectValue placeholder="Filtrar por usuario" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                          <SelectItem value="todos">Todos los usuarios</SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.idUsuario} value={u.idUsuario.toString()}>
                              {u.nombre} {u.apellido}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Tabla */}
                <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#F9FAFB] dark:bg-[#0A0F1E]">
                      <TableRow className="border-[#E5E7EB] dark:border-[#1F2937] hover:bg-transparent">
                        <TableHead className="w-12 h-11"></TableHead>
                        <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">ACCIÓN</TableHead>
                        <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">MOTIVO</TableHead>
                        <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">USUARIO</TableHead>
                        <TableHead className="text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">FECHA</TableHead>
                        <TableHead className="text-right text-[#6B7280] dark:text-[#9CA3AF] font-medium text-[12px] h-11">DETALLE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin h-6 w-6 mx-auto text-[#F97316]" /></TableCell></TableRow>
                      ) : filtered.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-12">
                          <Shield className="h-8 w-8 text-[#D1D5DB] dark:text-[#374151] mx-auto mb-3" />
                          <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">No se encontraron registros de auditoría</p>
                        </TableCell></TableRow>
                      ) : (
                        filtered.map((rec) => {
                          const cfg = accionConfig[rec.accion] || accionConfig.MODIFICAR;
                          const Icon = cfg.icon;
                          return (
                            <>
                              <TableRow key={rec.idAuditoria} className="hover:bg-[#F9FAFB] dark:hover:bg-white/5 border-[#E5E7EB] dark:border-[#1F2937] transition-colors group">
                                <TableCell className="py-3">
                                  <Button variant="ghost" size="icon" onClick={() => toggleExpand(rec.idAuditoria)}
                                    className="h-8 w-8 p-0 text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-white/10 rounded-lg transition-colors">
                                    {expandedRows.has(rec.idAuditoria) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </TableCell>
                                <TableCell className="py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border ${cfg.color}`}>
                                    <Icon className="w-3 h-3 mr-1" />{cfg.label}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                    <span className="text-[13px] font-medium text-[#111827] dark:text-white">{getMotivo(rec)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                      {getUserName(rec.idUsuario).charAt(0)}
                                    </div>
                                    <span className="text-[13px] text-[#4B5563] dark:text-[#9CA3AF]">{getUserName(rec.idUsuario)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  <div className="flex flex-col">
                                    <span className="text-[13px] text-[#111827] dark:text-white">{new Date(rec.fechaAuditoria).toLocaleDateString()}</span>
                                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">{new Date(rec.fechaAuditoria).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right py-3">
                                  <Button variant="ghost" size="icon" onClick={() => setDetailRecord(rec)}
                                    className="h-8 w-8 text-[#6B7280] hover:text-[#F97316] hover:bg-[#F97316]/10 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {expandedRows.has(rec.idAuditoria) && (
                                <TableRow className="bg-[#F9FAFB] dark:bg-[#0A0F1E]/30 hover:bg-[#F9FAFB] dark:hover:bg-[#0A0F1E]/30">
                                  <TableCell colSpan={6} className="p-0 border-[#E5E7EB] dark:border-[#1F2937]">
                                    <div className="p-4 pl-14">
                                      <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-4 shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {rec.datosAnteriores && (
                                            <div>
                                              <h4 className="text-[12px] font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-red-500" />Datos Anteriores
                                              </h4>
                                              <div className="bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 p-3 rounded-xl border border-[#E5E7EB] dark:border-[#1F2937]">
                                                {renderPrettyData(rec.datosAnteriores, "text-red-500 dark:text-red-400", rec.fechaAuditoria, true)}
                                              </div>
                                            </div>
                                          )}
                                          {rec.datosNuevos && (
                                            <div>
                                              <h4 className="text-[12px] font-bold text-[#10B981] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-[#10B981]" />Datos Nuevos
                                              </h4>
                                              <div className="bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 p-3 rounded-xl border border-[#E5E7EB] dark:border-[#1F2937]">
                                                {renderPrettyData(rec.datosNuevos, "text-[#10B981] dark:text-[#34D399]", rec.fechaAuditoria, false)}
                                              </div>
                                            </div>
                                          )}
                                          {!rec.datosAnteriores && !rec.datosNuevos && (
                                            <p className="text-[13px] text-[#6B7280] col-span-2 text-center py-4">Sin datos de cambio registrados</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Modal de Detalle */}
      <Dialog open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F97316]" />Detalle de Auditoría
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">
              Información completa del registro de cambio
            </DialogDescription>
          </DialogHeader>
          {detailRecord && (
            <div className="space-y-5 pt-2">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Acción", value: detailRecord.accion, icon: Shield },
                  { label: "Motivo", value: getMotivo(detailRecord), icon: FileText },
                  { label: "Usuario", value: getUserName(detailRecord.idUsuario), icon: User },
                  { label: "Fecha", value: new Date(detailRecord.fechaAuditoria).toLocaleString(), icon: Clock },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border border-[#E5E7EB] dark:border-[#1F2937]">
                    <item.icon className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{item.label}</p>
                      <p className="text-[13px] font-medium text-[#111827] dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Diff view */}
              <div className="border-t border-[#E5E7EB] dark:border-[#1F2937] pt-4">
                <h4 className="text-[14px] font-semibold text-[#111827] dark:text-white mb-3">Cambios Realizados</h4>
                {renderJsonDiff(parseJson(detailRecord.datosAnteriores), parseJson(detailRecord.datosNuevos))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AuditLog;
