import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { FileBarChart, TrendingDown, Package } from "lucide-react";
import TopSellingProducts from "@/components/reports/TopSellingProducts";
import LowRotationProducts from "@/components/reports/LowRotationProducts";
import SupplierEntries from "@/components/reports/SupplierEntries";

type ReportType = "top-selling" | "low-rotation" | "supplier-entries" | null;

const InventoryReport = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);

  const reportOptions = [
    {
      id: "top-selling" as const,
      title: "Productos más vendidos",
      description: "Reporte de productos con mayor rotación",
      icon: FileBarChart,
    },
    {
      id: "low-rotation" as const,
      title: "Productos con baja rotación",
      description: "Identifica productos que se venden poco",
      icon: TrendingDown,
    },
    {
      id: "supplier-entries" as const,
      title: "Entradas por proveedor",
      description: "Productos recibidos por proveedor",
      icon: Package,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex flex-1">
        <Sidebar activeSection="reportes" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8 lg:ml-0 ml-14">
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold mb-2 text-foreground">
                {selectedReport ? reportOptions.find(r => r.id === selectedReport)?.title : "Reportes"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {selectedReport
                  ? reportOptions.find(r => r.id === selectedReport)?.description
                  : "Seleccione el tipo de reporte que desea generar"}
              </p>
            </div>

            {!selectedReport ? (
              <div className="lg:ml-0 ml-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedReport(option.id)}
                      className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-xl lg:rounded-2xl shadow-lg p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 text-left group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                            {option.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="lg:ml-0 ml-14">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Volver a tipos de reportes
                </button>

                {selectedReport === "top-selling" && <TopSellingProducts />}
                {selectedReport === "low-rotation" && <LowRotationProducts />}
                {selectedReport === "supplier-entries" && <SupplierEntries />}
              </div>
            )}
          </div>
        </main>
      </div>

    </div>
  );
};

export default InventoryReport;
