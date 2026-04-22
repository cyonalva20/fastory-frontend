import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AuthService } from "@/api/authService";
import { Boxes } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    password: "",
    general: "",
  });
  const { toast } = useToast();

  // 🔹 CORRECCIÓN: Verificar si ya está autenticado al cargar la página
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      // Si ya tiene token, redirigir al home y reemplazar la historia para que no pueda volver atrás
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar errores previos
    setErrors({ username: "", password: "", general: "" });

    let hasErrors = false;
    const newErrors = { username: "", password: "", general: "" };

    // Validar campos vacíos
    if (!username.trim()) {
      newErrors.username = "Debe ingresar su usuario";
      hasErrors = true;
    }

    if (!password.trim()) {
      newErrors.password = "Debe ingresar su contraseña";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await AuthService.login(username, password);
      if (response.token) {
        // 🔹 NOTA: AuthService.login ya guarda el token y el user en localStorage
        // pero aquí hacemos una redirección explícita tras el éxito.
        
        toast({
          title: "Inicio de sesión exitoso",
          description: "Redirigiendo al panel principal...",
        });

        navigate("/", { replace: true }); // Redirigir al dashboard
      } else {
        setUsername("");
        setPassword("");
        setErrors({
          ...newErrors,
          general: response.message || "Error de autenticación",
        });
        toast({
          title: "Error de autenticación",
          description: response.message || "Usuario o contraseña incorrectos",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error en login:", error);

      let description = "No se pudo conectar al servidor";
      let title = "Error de autenticación";

      if (error?.message) {
        description = error.message;
        try {
          const parsed = JSON.parse(description);
          if (parsed && (parsed.message || parsed.error)) {
            description = parsed.message || parsed.error;
          }
        } catch {
          // Ignore JSON parse error, use original message
        }
      }

      const lower = description.toLowerCase();
      if (
        lower.includes("credencial") ||
        lower.includes("invalid") ||
        lower.includes("incorrect") ||
        lower.includes("usuario o contraseña")
      ) {
        description = "Usuario o contraseña incorrectos";
        setUsername("");
        setPassword("");
      }

      setErrors({ ...newErrors, general: description });
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-2xl shadow-xl shadow-black/20 p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Boxes className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-outfit font-bold text-foreground tracking-tight">
                Fastory
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Gestión inteligente de inventario</p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Usuario */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-medium text-foreground"
              >
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50 border-border/50 transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(220,70%,55%,0.12)] placeholder:text-muted-foreground/50"
              />
              {errors.username && (
                <p className="text-sm text-destructive mt-1">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50 border-border/50 transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(220,70%,55%,0.12)] placeholder:text-muted-foreground/50"
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Error general */}
            {errors.general && (
              <div className="text-center">
                <p className="text-sm text-destructive bg-destructive/10 py-2.5 px-4 rounded-lg border border-destructive/20">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Botón Iniciar Sesión */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
              size="lg"
            >
              Iniciar sesión
            </Button>

            {/* Enlace Olvidó su contraseña */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña? ¿Deseas cambiar tu contraseña actual?
              </Link>
            </div>
          </form>
        </div>

        {/* Texto inferior */}
        <p className="text-center text-sm text-muted-foreground/60 mt-6">
          Gestión inteligente de inventario para bodegas
        </p>
      </div>
    </div>
  );
};

export default Auth;