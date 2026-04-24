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
import { Check, X, Loader2 } from "lucide-react";

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
    <div className="h-screen flex font-poppins overflow-hidden bg-[#FFFFFF] dark:bg-[#0A0F1E]">
      <style>{`
        .form-group-hover:has(.input-wrapper:hover) .input-wrapper:not(:hover) {
          transform: scale(0.96);
          opacity: 0.45;
        }
        .input-wrapper {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-wrapper:hover {
          transform: scale(1.02);
          z-index: 10;
        }
        .input-wrapper:hover input {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.15) !important;
        }
      `}</style>
      
      {/* Left Column - Decorative Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-center items-center p-12 bg-gradient-to-br from-[#FFF7ED] via-[#FFEDD5] to-[#FED7AA] dark:from-[#0A0F1E] dark:via-[#111827] dark:to-[#1a1f35] transition-colors duration-300 z-10 animate-in fade-in slide-in-from-left-8 duration-700 ease-out">
        {/* Texture Grid */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        {/* Blobs Removed for Crisp Look */}

        {/* Organic Wave Cutout */}
        <div className="absolute right-0 top-0 h-full w-[60px] text-[#FFFFFF] dark:text-[#0A0F1E] pointer-events-none z-20 transition-colors duration-300">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M100,0 L100,100 L0,100 C50,75 50,25 0,0 Z" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-[420px]">
          <img src="/logo.png" alt="Fastory" className="h-[76px] w-auto drop-shadow-[0_0_24px_rgba(249,115,22,0.5)] animate-in zoom-in duration-700 delay-200 fill-mode-both" />
          <h2 className="text-[#7C2D12] dark:text-[#F97316] font-poppins font-[800] text-[46px] mt-3 mb-0 tracking-tight lowercase animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-both">fastory</h2>
          <p className="text-[#7C2D12]/80 dark:text-white/85 text-[16px] italic -mt-2 mb-10 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-both">Gestión inteligente de inventario</p>
          
          <div className="w-[85%] h-px bg-gradient-to-r from-transparent via-[#F97316] to-transparent my-6 opacity-30 animate-in fade-in duration-700 delay-300 fill-mode-both" />

          <div className="flex flex-col gap-8 w-full mt-6 px-4">
            <div className="group flex items-center gap-5 transition-all duration-300 hover:translate-x-3 cursor-default animate-in slide-in-from-left-4 fade-in duration-700 delay-300 fill-mode-both">
              <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] group-hover:bg-gradient-to-br group-hover:from-[#F97316] group-hover:to-[#EA580C]">
                <Check className="w-4 h-4 text-white stroke-[3] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-[#7C2D12] dark:text-white text-[15px] font-medium transition-colors duration-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">Control de stock en tiempo real.</span>
            </div>
            <div className="group flex items-center gap-5 transition-all duration-300 hover:translate-x-3 cursor-default animate-in slide-in-from-left-4 fade-in duration-700 delay-500 fill-mode-both">
              <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] group-hover:bg-gradient-to-br group-hover:from-[#F97316] group-hover:to-[#EA580C]">
                <Check className="w-4 h-4 text-white stroke-[3] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-[#7C2D12] dark:text-white text-[15px] font-medium transition-colors duration-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">Alertas de vencimiento automáticas.</span>
            </div>
            <div className="group flex items-center gap-5 transition-all duration-300 hover:translate-x-3 cursor-default animate-in slide-in-from-left-4 fade-in duration-700 delay-700 fill-mode-both">
              <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] group-hover:bg-gradient-to-br group-hover:from-[#F97316] group-hover:to-[#EA580C]">
                <Check className="w-4 h-4 text-white stroke-[3] transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-[#7C2D12] dark:text-white text-[15px] font-medium transition-colors duration-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">Roles diferenciados por usuario.</span>
            </div>
          </div>

          <div className="mt-16 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-1000 fill-mode-both">
            <div className="group cursor-default inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#F97316]/15 dark:bg-[#F97316]/15 border border-[#F97316]/40 dark:border-[#F97316]/50 shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:bg-[#F97316]/20 transition-all duration-300 hover:-translate-y-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F97316]"></span>
              </span>
              <span className="text-[#7C2D12] dark:text-[#F97316] text-[14.5px] font-semibold tracking-wide">Prueba gratuita por 90 días</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[58%] h-full overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col px-6 py-12 md:p-12 relative bg-[#FFFFFF] dark:bg-[#0A0F1E] transition-colors duration-300 animate-in fade-in slide-in-from-right-8 duration-700 delay-100 ease-out fill-mode-both">
        {/* Removed blob for crisp form background */}
        
        <div className="w-full max-w-[380px] mt-12 md:mt-20 lg:mt-24 mx-auto mb-auto relative z-10 pb-10">
          <div key={activeTab} className="animate-in fade-in slide-in-from-top-6 duration-700 ease-out">
            <h1 className="text-[#111827] dark:text-white font-poppins font-[700] text-[28px] mb-1">
              {activeTab === "login" ? "Bienvenido" : "Crea tu cuenta"}
            </h1>
            <p className="text-[#4B5563] dark:text-[#9CA3AF] text-[13px] mb-8 font-poppins">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-[#F3F4F6] dark:bg-[#111827] rounded-[12px] p-1 h-auto mb-8 border border-transparent dark:border-[#1F2937] flex">
              <TabsTrigger 
                value="login" 
                className="flex-1 py-2 rounded-[10px] data-[state=active]:bg-[#F97316] data-[state=active]:text-white text-[#6B7280] dark:text-white/60 hover:text-[#4B5563] dark:hover:text-white/80 font-poppins text-[14px] data-[state=active]:font-semibold transition-all duration-250 data-[state=active]:shadow-[0_2px_8px_rgba(249,115,22,0.4)] border-none bg-transparent"
              >
                Iniciar sesión
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="flex-1 py-2 rounded-[10px] data-[state=active]:bg-[#F97316] data-[state=active]:text-white text-[#6B7280] dark:text-white/60 hover:text-[#4B5563] dark:hover:text-white/80 font-poppins text-[14px] data-[state=active]:font-semibold transition-all duration-250 data-[state=active]:shadow-[0_2px_8px_rgba(249,115,22,0.4)] border-none bg-transparent"
              >
                Crear cuenta
              </TabsTrigger>
            </TabsList>

            {/* --- TAB DE LOGIN --- */}
            <TabsContent value="login" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="animate-in fade-in slide-in-from-left-12 duration-700 ease-out">
                <form onSubmit={handleLoginSubmit} className="space-y-5 form-group-hover">
                  <div className="relative group input-wrapper">
                    <Input
                      id="username"
                      type="text"
                      placeholder=" "
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${loginErrors.username ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`}
                    />
                    <Label 
                      htmlFor="username" 
                      className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins"
                    >
                      Usuario
                    </Label>
                    {username.length > 0 && !loginErrors.username && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                    )}
                    {loginErrors.username && (
                      <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                    )}
                  </div>
                  
                  <div className="relative group input-wrapper">
                    <Input
                      id="password"
                      type="password"
                      placeholder=" "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${loginErrors.password ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`}
                    />
                    <Label 
                      htmlFor="password" 
                      className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins"
                    >
                      Contraseña
                    </Label>
                    {password.length > 0 && !loginErrors.password && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                    )}
                    {loginErrors.password && (
                      <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                    )}
                  </div>

                  {loginErrors.general && (
                    <div className="text-center animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 py-2.5 px-4 rounded-lg border border-red-200 dark:border-red-500/20 font-poppins">
                        {loginErrors.general}
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="relative overflow-hidden w-full h-auto py-[13px] bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] active:translate-y-[0px] active:shadow-[0_2px_10px_rgba(249,115,22,0.4)] text-white font-poppins font-semibold rounded-[10px] transition-all duration-200 mt-6 border-none disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_15px_rgba(249,115,22,0.35)]" disabled={loginLoading}>
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[10px]" />
                    <span className="relative z-10 text-[15px] flex items-center justify-center">
                      {loginLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar sesión"}
                    </span>
                  </Button>

                  <div className="text-center mt-6">
                    <Link to="/forgot-password" className="text-[13px] text-[#F97316] hover:underline font-poppins transition-colors">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </form>
              </div>
            </TabsContent>

            {/* --- TAB DE REGISTRO (ONBOARDING) --- */}
            <TabsContent value="register" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="animate-in fade-in slide-in-from-right-12 duration-700 ease-out">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-5 pb-4 form-group-hover">
                    
                    {/* SECCIÓN: DATOS DE EMPRESA */}
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <FormField
                          control={registerForm.control}
                          name="nombreEmpresa"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-0 relative">
                              <FormControl>
                                <div className="relative group input-wrapper">
                                  <Input 
                                    placeholder=" " 
                                    {...field} 
                                    className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`} 
                                  />
                                  <Label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins">
                                    Nombre Comercial *
                                  </Label>
                                  {field.value && !fieldState.invalid && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                  )}
                                  {fieldState.invalid && (
                                    <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="ruc"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-0 relative">
                              <FormControl>
                                <div className="relative group input-wrapper">
                                  <Input 
                                    placeholder=" " 
                                    maxLength={11}
                                    {...field} 
                                    className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`} 
                                  />
                                  <Label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins">
                                    RUC (11 dígitos) *
                                  </Label>
                                  {field.value && !fieldState.invalid && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                  )}
                                  {fieldState.invalid && (
                                    <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* SEPARADOR DE SECCIONES */}
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-[#E5E7EB] dark:border-[#374151]"></div>
                      <span className="flex-shrink-0 mx-4 text-[12px] font-medium text-[#6B7280] dark:text-[#9CA3AF] bg-[#F3F4F6] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] px-3 py-1 rounded-full font-poppins">
                        Datos del Administrador
                      </span>
                      <div className="flex-grow border-t border-[#E5E7EB] dark:border-[#374151]"></div>
                    </div>
                    
                    {/* SECCIÓN: DATOS DEL ADMINISTRADOR */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="nombre"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-0 relative">
                              <FormControl>
                                <div className="relative group input-wrapper">
                                  <Input 
                                    placeholder=" " 
                                    {...field} 
                                    className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`} 
                                  />
                                  <Label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px] font-poppins">
                                    Nombres
                                  </Label>
                                  {field.value && !fieldState.invalid && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                  )}
                                  {fieldState.invalid && (
                                    <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="apellido"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-0 relative">
                              <FormControl>
                                <div className="relative group input-wrapper">
                                  <Input 
                                    placeholder=" " 
                                    {...field} 
                                    className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`} 
                                  />
                                  <Label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px] font-poppins">
                                    Apellidos
                                  </Label>
                                  {field.value && !fieldState.invalid && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                  )}
                                  {fieldState.invalid && (
                                    <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4">
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-0 relative">
                              <FormControl>
                                <div className="relative group input-wrapper">
                                  <Input 
                                    placeholder=" " 
                                    type="email"
                                    {...field} 
                                    className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`} 
                                  />
                                  <Label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins">
                                    Correo Electrónico *
                                  </Label>
                                  {field.value && !fieldState.invalid && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                  )}
                                  {fieldState.invalid && (
                                    <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-0 relative">
                              <FormControl>
                                <div className="relative group input-wrapper">
                                  <Input 
                                    placeholder=" " 
                                    {...field} 
                                    className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`} 
                                  />
                                  <Label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins">
                                    Usuario de Acceso *
                                  </Label>
                                  {field.value && !fieldState.invalid && (
                                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                  )}
                                  {fieldState.invalid && (
                                    <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-0 relative">
                              <FormControl>
                                <div className="relative group input-wrapper">
                                  <Input 
                                    placeholder=" " 
                                    type="password"
                                    {...field} 
                                    className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`} 
                                  />
                                  <Label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px] font-poppins">
                                    Contraseña
                                  </Label>
                                  {field.value && !fieldState.invalid && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                  )}
                                  {fieldState.invalid && (
                                    <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field, fieldState }) => (
                            <FormItem className="space-y-0 relative">
                              <FormControl>
                                <div className="relative group input-wrapper">
                                  <Input 
                                    placeholder=" " 
                                    type="password"
                                    {...field} 
                                    className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${fieldState.invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`} 
                                  />
                                  <Label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px] font-poppins">
                                    Confirmar
                                  </Label>
                                  {field.value && !fieldState.invalid && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                  )}
                                  {fieldState.invalid && (
                                    <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {registerError && (
                      <div className="text-center mt-6 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 py-2.5 px-4 rounded-[10px] border border-red-200 dark:border-red-500/20 font-poppins">
                          {registerError}
                        </p>
                      </div>
                    )}

                    <Button type="submit" className="relative overflow-hidden w-full h-auto py-[13px] bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] active:translate-y-[0px] active:shadow-[0_2px_10px_rgba(249,115,22,0.4)] text-white font-poppins font-semibold rounded-[10px] transition-all duration-200 mt-8 border-none disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_15px_rgba(249,115,22,0.35)]" disabled={registerLoading}>
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[10px]" />
                      <span className="relative z-10 text-[15px] flex items-center justify-center">
                        {registerLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear cuenta"}
                      </span>
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;