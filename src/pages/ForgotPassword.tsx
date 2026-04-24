import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { AuthService } from "@/api/authService";
import { toast } from "sonner";

const ForgotPassword = () => {
    // --- LÓGICA EXISTENTE INTACTA ---
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

    // --- NUEVA LÓGICA DE UI Y TRANSICIONES ---
    const [viewStep, setViewStep] = useState(step);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (step !== viewStep) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setViewStep(step);
                setIsAnimating(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [step, viewStep]);

    // UI States for Step 2
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        if (step === 2 && timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timeLeft, step]);

    useEffect(() => {
        if (!code) {
           setCodeDigits(Array(6).fill(""));
        }
    }, [code]);

    const handleDigitChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...codeDigits];
        newDigits[index] = value.slice(-1);
        setCodeDigits(newDigits);
        setCode(newDigits.join(''));

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const isCodeComplete = codeDigits.every(d => d !== "");

    const handleResend = async () => {
        if (timeLeft > 0) return;
        try {
            await AuthService.sendRecoveryCode(email);
            setTimeLeft(60);
            toast.success("Código reenviado.");
        } catch (error: any) {
            toast.error(error.message || "Error al reenviar el código.");
        }
    };

    // UI States for Step 3
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        return score;
    };
    const strengthScore = getPasswordStrength(passwords.newPassword);
    const strengthConfig = [
        { label: '', color: 'bg-[#E5E7EB] dark:bg-[#1F2937]', textClass: '' },
        { label: 'Débil', color: 'bg-red-500', textClass: 'text-red-500' },
        { label: 'Regular', color: 'bg-orange-500', textClass: 'text-orange-500' },
        { label: 'Fuerte', color: 'bg-yellow-500', textClass: 'text-yellow-500' },
        { label: 'Muy fuerte', color: 'bg-[#10B981]', textClass: 'text-[#10B981]' }
    ];
    const currentStrength = strengthConfig[strengthScore === 0 ? (passwords.newPassword ? 1 : 0) : strengthScore];

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
                <div className="w-full max-w-[380px] mt-12 md:mt-20 lg:mt-24 mx-auto mb-auto relative z-10 pb-10">
                    
                    {/* Indicador de pasos */}
                    {!success && (
                        <div className="flex items-center justify-between w-full mb-14 relative px-2">
                            <div className="absolute left-0 top-4 w-full h-px bg-[#E5E7EB] dark:bg-[#1F2937] z-0" />
                            {[
                                { id: 1, label: 'Correo' },
                                { id: 2, label: 'Código' },
                                { id: 3, label: 'Contraseña' }
                            ].map(s => {
                                const isActive = step >= s.id;
                                const isCurrent = step === s.id;
                                return (
                                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 bg-[#FFFFFF] dark:bg-[#0A0F1E] px-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all duration-300 ${
                                            isActive 
                                            ? 'bg-[#F97316] text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
                                            : 'bg-[#E5E7EB] dark:bg-[#1F2937] text-[#6B7280] dark:text-[#9CA3AF]'
                                        }`}>
                                            {s.id}
                                        </div>
                                        <span className={`text-[11px] font-poppins absolute -bottom-6 transition-colors duration-300 whitespace-nowrap ${
                                            isCurrent ? 'text-[#F97316] font-medium' : 'text-[#6B7280] dark:text-[#9CA3AF]'
                                        }`}>
                                            {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {success ? (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-2">
                                <Check className="w-8 h-8 text-[#10B981]" />
                            </div>
                            <h2 className="text-[#111827] dark:text-white font-poppins font-[700] text-[24px]">
                                ¡Contraseña actualizada!
                            </h2>
                            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[14px] font-poppins text-center">
                                Redirigiendo al inicio de sesión...
                            </p>
                        </div>
                    ) : (
                        <div className={`transition-all ${isAnimating ? 'animate-out slide-out-to-left-5 fade-out duration-300 opacity-0' : 'animate-in slide-in-from-right-5 fade-in duration-300 opacity-100'}`}>
                            
                            {/* PASO 1 */}
                            {viewStep === 1 && (
                                <form onSubmit={handleSendCode} className="space-y-5 form-group-hover">
                                    <div className="mb-8">
                                        <h1 className="text-[#111827] dark:text-white font-poppins font-[700] text-[28px] mb-1">
                                            Recupera tu acceso
                                        </h1>
                                        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[13px] font-poppins">
                                            Te enviaremos un código de 6 dígitos a tu correo
                                        </p>
                                    </div>

                                    <div className="relative group input-wrapper">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder=" "
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${errors.email ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`}
                                            disabled={loading}
                                        />
                                        <Label 
                                            htmlFor="email" 
                                            className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins"
                                        >
                                            Correo Electrónico
                                        </Label>
                                        {email.length > 0 && !errors.email && (
                                            <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                        )}
                                        {errors.email && (
                                            <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                        )}
                                    </div>

                                    {errors.email && (
                                        <div className="text-center animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 py-2.5 px-4 rounded-[10px] border border-red-200 dark:border-red-500/20 font-poppins">
                                                {errors.email}
                                            </p>
                                        </div>
                                    )}

                                    <Button type="submit" className="relative overflow-hidden w-full h-auto py-[13px] bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] active:translate-y-[0px] active:shadow-[0_2px_10px_rgba(249,115,22,0.4)] text-white font-poppins font-semibold rounded-[10px] transition-all duration-200 mt-6 border-none disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_15px_rgba(249,115,22,0.35)]" disabled={loading}>
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[10px]" />
                                        <span className="relative z-10 text-[15px] flex items-center justify-center">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar código"}
                                        </span>
                                    </Button>

                                    <div className="text-center mt-6">
                                        <Link to="/auth" className="inline-flex items-center justify-center gap-2 text-[13.5px] font-semibold text-[#F97316] bg-[#F97316]/10 hover:bg-[#F97316]/20 px-5 py-2.5 rounded-[10px] transition-all duration-300 font-poppins hover:-translate-y-0.5 shadow-sm hover:shadow-[0_4px_12px_rgba(249,115,22,0.15)]">
                                            <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
                                        </Link>
                                    </div>
                                </form>
                            )}

                            {/* PASO 2 */}
                            {viewStep === 2 && (
                                <form onSubmit={handleVerifyCode} className="space-y-5 form-group-hover">
                                    <div className="mb-8">
                                        <h1 className="text-[#111827] dark:text-white font-poppins font-[700] text-[28px] mb-1">
                                            Revisa tu correo
                                        </h1>
                                        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[13px] font-poppins">
                                            Ingresa el código de 6 dígitos que enviamos a {email}
                                        </p>
                                    </div>

                                    <div className="flex justify-between gap-1 my-8">
                                        {codeDigits.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (inputRefs.current[index] = el)}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleDigitChange(index, e.target.value)}
                                                onKeyDown={(e) => handleDigitKeyDown(index, e)}
                                                disabled={loading}
                                                className={`w-[52px] h-[60px] bg-[#F9FAFB] dark:bg-[#111827] border rounded-[10px] text-center text-[#111827] dark:text-white font-poppins font-bold text-[24px] transition-all duration-200 outline-none
                                                ${isCodeComplete ? 'border-[#F97316] shadow-[0_0_0_2px_rgba(249,115,22,0.1)]' : 'border-[#E5E7EB] dark:border-[#374151] focus:border-[#F97316] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]'}
                                                ${errors.code ? '!border-red-500 !shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`}
                                            />
                                        ))}
                                    </div>

                                    {isCodeComplete && !errors.code && (
                                        <div className="flex justify-center -mt-4 mb-2 animate-in fade-in zoom-in duration-300">
                                            <Check className="w-5 h-5 text-[#10B981]" />
                                        </div>
                                    )}

                                    {errors.code && (
                                        <div className="text-center animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 py-2.5 px-4 rounded-[10px] border border-red-200 dark:border-red-500/20 font-poppins">
                                                {errors.code}
                                            </p>
                                        </div>
                                    )}

                                    <Button type="submit" className="relative overflow-hidden w-full h-auto py-[13px] bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] active:translate-y-[0px] active:shadow-[0_2px_10px_rgba(249,115,22,0.4)] text-white font-poppins font-semibold rounded-[10px] transition-all duration-200 mt-6 border-none disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_15px_rgba(249,115,22,0.35)]" disabled={loading || !isCodeComplete}>
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[10px]" />
                                        <span className="relative z-10 text-[15px] flex items-center justify-center">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar código"}
                                        </span>
                                    </Button>

                                    <div className="text-center mt-6 flex flex-col items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={timeLeft > 0 || loading}
                                            className={`text-[13px] font-poppins transition-colors ${timeLeft > 0 ? 'text-[#6B7280] dark:text-[#9CA3AF] cursor-default' : 'text-[#F97316] hover:underline'}`}
                                        >
                                            ¿No recibiste el código? {timeLeft > 0 ? `Reenviar en ${timeLeft}s` : 'Reenviar'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setStep(1); setCodeDigits(Array(6).fill("")); setCode(""); }}
                                            className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white font-poppins transition-colors mt-2"
                                        >
                                            Cambiar correo electrónico
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* PASO 3 */}
                            {viewStep === 3 && (
                                <form onSubmit={handleResetPassword} className="space-y-5 form-group-hover">
                                    <div className="mb-8">
                                        <h1 className="text-[#111827] dark:text-white font-poppins font-[700] text-[28px] mb-1">
                                            Nueva contraseña
                                        </h1>
                                        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[13px] font-poppins">
                                            Elige una contraseña segura para tu cuenta
                                        </p>
                                    </div>

                                    <div className="relative group input-wrapper">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            placeholder=" "
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${errors.newPassword ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`}
                                            disabled={loading}
                                        />
                                        <Label 
                                            htmlFor="newPassword" 
                                            className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins"
                                        >
                                            Nueva contraseña
                                        </Label>
                                        
                                        <button 
                                            type="button" 
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-10 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>

                                        {passwords.newPassword.length > 0 && !errors.newPassword && strengthScore >= 3 && (
                                            <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                        )}
                                        {errors.newPassword && (
                                            <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                        )}
                                    </div>
                                    
                                    <div className="px-1 mt-2">
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4].map(level => (
                                                <div key={level} className={`h-1 rounded-full flex-1 transition-colors duration-300 ${
                                                    level <= strengthScore && passwords.newPassword.length > 0 ? currentStrength.color : 'bg-[#E5E7EB] dark:bg-[#374151]'
                                                }`} />
                                            ))}
                                        </div>
                                        {passwords.newPassword && (
                                            <p className={`text-[12px] mt-1.5 font-poppins font-medium ${currentStrength.textClass}`}>
                                                {currentStrength.label}
                                            </p>
                                        )}
                                    </div>

                                    {errors.newPassword && (
                                        <div className="text-center animate-in fade-in zoom-in-95 duration-200 mt-2">
                                            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 py-1.5 px-3 rounded-[10px] border border-red-200 dark:border-red-500/20 font-poppins">
                                                {errors.newPassword}
                                            </p>
                                        </div>
                                    )}

                                    <div className="relative group input-wrapper mt-5">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder=" "
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            className={`peer h-[54px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#111827] border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] dark:focus-visible:border-[#F97316] rounded-[10px] font-poppins transition-all duration-200 shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] ${errors.confirmPassword || (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword) ? 'border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`}
                                            disabled={loading}
                                        />
                                        <Label 
                                            htmlFor="confirmPassword" 
                                            className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[14px] font-poppins"
                                        >
                                            Confirmar contraseña
                                        </Label>

                                        <button 
                                            type="button" 
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-10 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>

                                        {passwords.confirmPassword.length > 0 && passwords.newPassword === passwords.confirmPassword && !errors.confirmPassword && (
                                            <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10B981] animate-in zoom-in duration-200" />
                                        )}
                                        {(errors.confirmPassword || (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword)) && (
                                            <X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-in zoom-in duration-200" />
                                        )}
                                    </div>

                                    {errors.confirmPassword && (
                                        <div className="text-center animate-in fade-in zoom-in-95 duration-200 mt-2">
                                            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 py-1.5 px-3 rounded-[10px] border border-red-200 dark:border-red-500/20 font-poppins">
                                                {errors.confirmPassword}
                                            </p>
                                        </div>
                                    )}

                                    <Button type="submit" className="relative overflow-hidden w-full h-auto py-[13px] bg-gradient-to-r from-orange-500 to-orange-600 shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] active:translate-y-[0px] active:shadow-[0_2px_10px_rgba(249,115,22,0.4)] text-white font-poppins font-semibold rounded-[10px] transition-all duration-200 mt-8 border-none disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_15px_rgba(249,115,22,0.35)]" disabled={loading}>
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[10px]" />
                                        <span className="relative z-10 text-[15px] flex items-center justify-center">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cambiar contraseña"}
                                        </span>
                                    </Button>
                                </form>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;