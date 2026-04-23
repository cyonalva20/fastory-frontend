import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { AuthService } from "@/api/authService";
import { Boxes, Building, UserCircle } from "lucide-react";

// --- ZOD SCHEMAS ---
const registerSchema = z
  .object({
    nombreEmpresa: z.string().min(2, "El nombre comercial es obligatorio"),
    ruc: z
      .string()
      .regex(/^\d{11}$/, "El RUC debe tener exactamente 11 dígitos numéricos"),
    nombre: z.string().min(2, "El nombre es obligatorio"),
    apellido: z.string().min(2, "El apellido es obligatorio"),
    email: z.string().email("Debe ser un correo válido"),
    username: z.string().min(4, "El usuario debe tener al menos 4 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  // --- ESTADOS DE LOGIN EXISTENTES ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState({
    username: "",
    password: "",
    general: "",
  });
  const [loginLoading, setLoginLoading] = useState(false);

  // --- ESTADOS DE REGISTRO ---
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombreEmpresa: "",
      ruc: "",
      nombre: "",
      apellido: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // --- HANDLER LOGIN (Mantenido intacto de tu código original, solo agregado loading y limpieza) ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({ username: "", password: "", general: "" });
    let hasErrors = false;
    const newErrors = { username: "", password: "", general: "" };

    if (!username.trim()) {
      newErrors.username = "Debe ingresar su usuario";
      hasErrors = true;
    }
    if (!password.trim()) {
      newErrors.password = "Debe ingresar su contraseña";
      hasErrors = true;
    }
    if (hasErrors) {
      setLoginErrors(newErrors);
      return;
    }

    try {
      setLoginLoading(true);
      const response = await AuthService.login(username, password);
      if (response.token) {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Redirigiendo al panel principal...",
        });
        navigate("/", { replace: true });
      } else {
        setUsername("");
        setPassword("");
        setLoginErrors({
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
        } catch {}
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
      setLoginErrors({ ...newErrors, general: description });
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // --- HANDLER REGISTRO ---
  const handleRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      setRegisterLoading(true);
      setRegisterError("");
      
      await AuthService.register({
        nombreEmpresa: values.nombreEmpresa,
        ruc: values.ruc,
        nombre: values.nombre,
        apellido: values.apellido,
        email: values.email,
        username: values.username,
        password: values.password
      });

      toast({
        title: "¡Empresa registrada exitosamente!",
        description: "Inicie sesión con su nueva cuenta de administrador.",
        variant: "default",
      });
      
      // Limpiar y cambiar a login
      registerForm.reset();
      setActiveTab("login");
      setUsername(values.username); // Pre-llenar el username
      setPassword("");

    } catch (error: any) {
      console.error("Error en registro:", error);
      let errorMsg = error.message || "Error al intentar registrar la empresa.";
      try {
         const parsed = JSON.parse(errorMsg);
         if (parsed.error || parsed.message) errorMsg = parsed.error || parsed.message;
      } catch {}
      setRegisterError(errorMsg);
      toast({
        title: "Registro fallido",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="glass-card rounded-2xl shadow-xl shadow-black/20 p-8">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Boxes className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-outfit font-bold text-foreground tracking-tight">Fastory</h1>
              <p className="text-sm text-muted-foreground mt-1">SaaS de Inventario para Empresas</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Crear Cuenta</TabsTrigger>
            </TabsList>

            {/* --- TAB DE LOGIN --- */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50"
                  />
                  {loginErrors.username && <p className="text-sm text-destructive mt-1">{loginErrors.username}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl bg-secondary/50"
                  />
                  {loginErrors.password && <p className="text-sm text-destructive mt-1">{loginErrors.password}</p>}
                </div>

                {loginErrors.general && (
                  <div className="text-center">
                    <p className="text-sm text-destructive bg-destructive/10 py-2.5 px-4 rounded-lg border border-destructive/20">
                      {loginErrors.general}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loginLoading}>
                  {loginLoading ? "Iniciando..." : "Iniciar sesión"}
                </Button>

                <div className="text-center">
                  <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </form>
            </TabsContent>

            {/* --- TAB DE REGISTRO (ONBOARDING) --- */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-6">
                  
                  {/* SECCIÓN: DATOS DE EMPRESA */}
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                      <Building className="w-5 h-5" />
                      <h3 className="font-semibold text-sm uppercase tracking-wider">Datos de la Empresa</h3>
                    </div>
                    <div className="grid gap-4">
                      <FormField
                        control={registerForm.control}
                        name="nombreEmpresa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Comercial *</FormLabel>
                            <FormControl><Input placeholder="Mi Empresa S.A.C." {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="ruc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RUC (11 dígitos) *</FormLabel>
                            <FormControl><Input placeholder="10456123456" maxLength={11} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* SECCIÓN: DATOS DEL ADMINISTRADOR */}
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-4 text-primary">
                      <UserCircle className="w-5 h-5" />
                      <h3 className="font-semibold text-sm uppercase tracking-wider">Administrador Principal</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombres *</FormLabel>
                            <FormControl><Input placeholder="Juan" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="apellido"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellidos *</FormLabel>
                            <FormControl><Input placeholder="Perez" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 mt-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo Electrónico *</FormLabel>
                            <FormControl><Input type="email" placeholder="admin@empresa.com" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuario de Acceso *</FormLabel>
                            <FormControl><Input placeholder="admin_empresa" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña *</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar *</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {registerError && (
                    <div className="text-center">
                      <p className="text-sm text-destructive bg-destructive/10 py-2.5 px-4 rounded-lg border border-destructive/20">
                        {registerError}
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12" disabled={registerLoading}>
                    {registerLoading ? "Creando Entorno SaaS..." : "Comenzar Prueba Gratuita"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;