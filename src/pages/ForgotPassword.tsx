import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ArrowLeft, Mail, KeyRound, Lock, Loader2, Boxes } from "lucide-react";
import { AuthService } from "@/api/authService";
import { toast } from "sonner";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    
    // Datos del flujo
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    // Errores locales
    const [errors, setErrors] = useState({
        email: "",
        code: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [success, setSuccess] = useState(false);

    // PASO 1: ENVIAR CÓDIGO
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({ ...errors, email: "" });

        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setErrors(prev => ({ ...prev, email: "Ingrese un correo electrónico válido" }));
            return;
        }

        setLoading(true);
        try {
            await AuthService.sendRecoveryCode(email);
            toast.success("Código enviado. Revise su correo.");
            setStep(2);
        } catch (error: any) {
            toast.error(error.message || "Error al enviar el código.");
        } finally {
            setLoading(false);
        }
    };

    // PASO 2: VERIFICAR CÓDIGO
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({ ...errors, code: "" });

        if (!code.trim() || code.length !== 6) {
            setErrors(prev => ({ ...prev, code: "El código debe tener 6 dígitos" }));
            return;
        }

        setLoading(true);
        try {
            await AuthService.verifyRecoveryCode(email, code);
            toast.success("Código verificado correctamente.");
            setStep(3);
        } catch (error: any) {
            setErrors(prev => ({ ...prev, code: "Código incorrecto o expirado." }));
            toast.error("Error en la verificación.");
        } finally {
            setLoading(false);
        }
    };

    // PASO 3: CAMBIAR CONTRASEÑA
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({ ...errors, newPassword: "", confirmPassword: "" });

        const { newPassword, confirmPassword } = passwords;
        let hasErrors = false;
        const newErrors = { ...errors };

        // Validar requisitos
        if (newPassword.length < 8) {
            newErrors.newPassword = "Mínimo 8 caracteres";
            hasErrors = true;
        } else if (!/[A-Z]/.test(newPassword)) {
            newErrors.newPassword = "Debe incluir una mayúscula";
            hasErrors = true;
        } else if (!/[a-z]/.test(newPassword)) {
            newErrors.newPassword = "Debe incluir una minúscula";
            hasErrors = true;
        } else if (!/[0-9]/.test(newPassword)) {
            newErrors.newPassword = "Debe incluir un número";
            hasErrors = true;
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden";
            hasErrors = true;
        }

        if (hasErrors) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            await AuthService.resetPassword(email, code, newPassword);
            setSuccess(true);
            setTimeout(() => {
                navigate("/auth");
            }, 3000);
        } catch (error: any) {
            toast.error(error.message || "No se pudo cambiar la contraseña.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="glass-card rounded-2xl shadow-xl shadow-black/20 p-8 space-y-6">

                    {/* Header */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                            <Boxes className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-outfit font-bold text-foreground text-center">
                            {step === 1 && "Cambia tu contraseña"}
                            {step === 2 && "Verificación"}
                            {step === 3 && "Nueva Contraseña"}
                        </h1>
                        <p className="text-sm text-muted-foreground text-center px-4">
                            {step === 1 && "Ingrese su correo electrónico para recibir un código de recuperación."}
                            {step === 2 && `Hemos enviado un código de 6 dígitos a ${email}`}
                            {step === 3 && "Cree una nueva contraseña segura para su cuenta."}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success ? (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            <Alert className="rounded-xl bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex flex-col items-center text-center py-6">
                                <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-400" />
                                <AlertDescription className="text-base font-medium">
                                    ¡Contraseña actualizada!
                                </AlertDescription>
                                <p className="text-sm mt-2 opacity-90">
                                    Redirigiendo al inicio de sesión...
                                </p>
                            </Alert>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Email */}
                            {step === 1 && (
                                <form onSubmit={handleSendCode} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="ejemplo@correo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all"
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                                    </div>

                                    <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 transition-all" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar Código"}
                                    </Button>
                                </form>
                            )}

                            {/* Step 2: Code */}
                            {step === 2 && (
                                <form onSubmit={handleVerifyCode} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-sm font-medium">Código de Verificación</Label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="code"
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                                className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all tracking-widest text-lg"
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.code && <p className="text-sm text-destructive mt-1">{errors.code}</p>}
                                    </div>

                                    <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 transition-all" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verificar Código"}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => { setStep(1); setCode(""); }}
                                        className="w-full text-muted-foreground hover:text-foreground"
                                        disabled={loading}
                                    >
                                        Cambiar correo electrónico
                                    </Button>
                                </form>
                            )}

                            {/* Step 3: New Password */}
                            {step === 3 && (
                                <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwords.newPassword}
                                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all"
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.newPassword && <p className="text-sm text-destructive mt-1">{errors.newPassword}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={passwords.confirmPassword}
                                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary transition-all"
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
                                    </div>

                                    <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg space-y-1 border border-border/30">
                                        <p className="font-medium text-foreground">Requisitos:</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            <li className={passwords.newPassword.length >= 8 ? "text-emerald-400" : ""}>Mínimo 8 caracteres</li>
                                            <li className={/[A-Z]/.test(passwords.newPassword) ? "text-emerald-400" : ""}>Una mayúscula</li>
                                            <li className={/[a-z]/.test(passwords.newPassword) ? "text-emerald-400" : ""}>Una minúscula</li>
                                            <li className={/[0-9]/.test(passwords.newPassword) ? "text-emerald-400" : ""}>Un número</li>
                                        </ul>
                                    </div>

                                    <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 transition-all" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar Contraseña"}
                                    </Button>
                                </form>
                            )}
                        </>
                    )}

                    {/* Footer Link */}
                    {!success && (
                        <div className="text-center pt-2">
                            <Link
                                to="/auth"
                                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;