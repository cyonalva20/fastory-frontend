import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import { FileBarChart, TrendingDown, Package, ArrowLeft, BarChart3 } from "lucide-react";
import TopSellingProducts from "@/components/reports/TopSellingProducts";
import LowRotationProducts from "@/components/reports/LowRotationProducts";
import SupplierEntries from "@/components/reports/SupplierEntries";
import AppHeader from "@/components/AppHeader"; // <-- Import AppHeader
import { Button } from "@/components/ui/button";

type ReportType = "top-selling" | "low-rotation" | "supplier-entries" | null;

const InventoryReport = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);

  const reportOptions = [
    {
      id: "top-selling" as const,
      title: "Productos más vendidos",
      description: "Reporte de productos con mayor rotación y demanda",
      icon: FileBarChart,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      borderColor: "border-blue-100 dark:border-blue-500/20",
    },
    {
      id: "low-rotation" as const,
      title: "Productos con baja rotación",
      description: "Identifica productos que se venden poco o están estancados",
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-500/10",
      borderColor: "border-red-100 dark:border-red-500/20",
    },
    {
      id: "supplier-entries" as const,
      title: "Entradas por proveedor",
      description: "Análisis de productos recibidos por cada proveedor",
      icon: Package,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
      borderColor: "border-emerald-100 dark:border-emerald-500/20",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="reportes" />
        
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle={selectedReport ? reportOptions.find(r => r.id === selectedReport)?.title || "Reporte" : "Reportes Estadísticos"} />
          
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
              
              <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    {selectedReport ? reportOptions.find(r => r.id === selectedReport)?.title : "Reportes Estadísticos"}
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    {selectedReport
                      ? reportOptions.find(r => r.id === selectedReport)?.description
                      : "Seleccione el tipo de reporte que desea analizar"}
                  </p>
                </div>
                {selectedReport && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReport(null)}
                    className="h-10 px-4 border-[#E5E7EB] dark:border-[#1F2937] hover:bg-[#F3F4F6] dark:hover:bg-white/5 rounded-[10px] text-[13px] gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Volver a reportes
                  </Button>
                )}
              </div>

              {!selectedReport ? (
                <div className="lg:ml-0 ml-14">
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                    
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold text-[#111827] dark:text-white">Análisis de Rendimiento</h3>
                        <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">Métricas y estadísticas detalladas de su inventario</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reportOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => setSelectedReport(option.id)}
                            className="group relative bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl p-6 text-left transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 overflow-hidden"
                          >
                            <div className={`absolute top-0 left-0 w-1 h-full ${option.bgColor.split(' ')[0]} dark:${option.bgColor.split(' ')[1]} transition-transform origin-bottom scale-y-0 group-hover:scale-y-100 duration-300`} />
                            
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl border ${option.bgColor} ${option.borderColor} ${option.color} transition-transform group-hover:scale-110 duration-300`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-[15px] font-bold text-[#111827] dark:text-white mb-1.5 group-hover:text-[#F97316] transition-colors">
                                  {option.title}
                                </h3>
                                <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="lg:ml-0 ml-14 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm p-1">
                    {selectedReport === "top-selling" && <TopSellingProducts />}
                    {selectedReport === "low-rotation" && <LowRotationProducts />}
                    {selectedReport === "supplier-entries" && <SupplierEntries />}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default InventoryReport;
