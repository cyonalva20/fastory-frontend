import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Boxes, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="text-center relative z-10 space-y-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/10">
            <Boxes className="w-8 h-8 text-primary/60" />
          </div>
        </div>
        <h1 className="text-7xl font-outfit font-bold text-gradient">404</h1>
        <p className="text-xl text-muted-foreground">Página no encontrada</p>
        <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto">
          La ruta <code className="text-primary/80 bg-secondary/50 px-2 py-0.5 rounded text-xs">{location.pathname}</code> no existe en el sistema.
        </p>
        <Link to="/">
          <Button variant="outline" className="gap-2 mt-4 border-border/50 hover:border-primary/30 hover:bg-primary/5">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
