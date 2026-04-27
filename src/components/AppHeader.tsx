import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, Bell, ChevronDown, LogOut, CreditCard } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SubscriptionPanel from "@/pages/SubscriptionPanel";
import { useSidebar } from "./SidebarContext";

interface AppHeaderProps {
  sectionTitle: string;
  alertCount?: number;
}

const AppHeader = ({ sectionTitle, alertCount = 0 }: AppHeaderProps) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { suscripcionEstado } = useSidebar();

  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : null;
  const username = currentUser?.username || "Usuario";
  const initials = username.slice(0, 2).toUpperCase();
  const nombreEmpresa = localStorage.getItem("fastory-empresa") || "Mi Bodega";

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("fastory-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("fastory-theme", "light");
    }
  };

  // Initialize theme from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("fastory-theme");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("fastory-empresa");
    navigate("/auth");
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b bg-white dark:bg-[#0D1117] border-[#E5E7EB] dark:border-[#1F2937] shrink-0 z-30">
      {/* Left — Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-[#9CA3AF] dark:text-white/50">Fastory</span>
        <span className="text-[#D1D5DB] dark:text-white/30">/</span>
        <span className="text-[#111827] dark:text-white/90">{sectionTitle}</span>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[#6B7280] dark:text-white/60 hover:bg-[#F3F4F6] dark:hover:bg-white/10 transition-colors duration-200"
          aria-label="Cambiar tema"
        >
          {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications Bell */}
        <button
          className="p-2 rounded-lg text-[#6B7280] dark:text-white/60 hover:bg-[#F3F4F6] dark:hover:bg-white/10 transition-colors duration-200 relative"
          aria-label="Notificaciones"
          onClick={() => navigate("/dashboard")}
        >
          <Bell className="w-[18px] h-[18px]" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1 leading-none">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          )}
        </button>

        {/* Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-white/10 transition-colors duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] dark:text-white/50 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] shadow-lg py-1.5 z-50 animate-fade-in">
              <div className="px-3.5 py-2.5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                <p className="text-[14px] font-bold text-[#111827] dark:text-white truncate">{username}</p>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${suscripcionEstado?.estadoSuscripcion === 'VENCIDO' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} title={suscripcionEstado?.estadoSuscripcion || 'ACTIVO'} />
                  <p className="text-[12px] font-semibold text-[#F97316] truncate">{nombreEmpresa}</p>
                </div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md bg-[#111827] dark:bg-white/10 text-white dark:text-white/80">
                  {currentUser?.rol?.toUpperCase() || "USUARIO"}
                </span>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setIsSubscriptionModalOpen(true);
                }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#374151] dark:text-white/80 hover:bg-[#F3F4F6] dark:hover:bg-white/5 transition-colors w-full text-left"
              >
                <CreditCard className="w-4 h-4" />
                Mi Plan
              </button>
              <div className="h-px bg-[#E5E7EB] dark:bg-[#1F2937] mx-2 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937] p-0 overflow-hidden">
          <SubscriptionPanel />
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default AppHeader;
