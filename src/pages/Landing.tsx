import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X, Box, MapPin, AlertTriangle, Users, FileSpreadsheet, Lock } from "lucide-react";

const Landing = () => {
  const [isDark, setIsDark] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Inicializar el modo oscuro
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80; // h-20 = 5rem = 80px
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  const features = [
    {
      icon: <Box className="w-8 h-8 text-[#F97316]" />,
      title: "Control de Stock",
      desc: "Entradas, salidas y ajustes en tiempo real"
    },
    {
      icon: <MapPin className="w-8 h-8 text-[#F97316]" />,
      title: "WMS — Ubicación física",
      desc: "Asigna cada producto a su repisa y columna"
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-[#F97316]" />,
      title: "Alertas de vencimiento",
      desc: "Notificaciones automáticas de productos próximos a vencer"
    },
    {
      icon: <Users className="w-8 h-8 text-[#F97316]" />,
      title: "Multi-usuario",
      desc: "Roles diferenciados: Admin, Almacenero y Supervisor"
    },
    {
      icon: <FileSpreadsheet className="w-8 h-8 text-[#F97316]" />,
      title: "Reportes exportables",
      desc: "Excel y PDF con un clic"
    },
    {
      icon: <Lock className="w-8 h-8 text-[#F97316]" />,
      title: "Datos aislados",
      desc: "Cada bodega ve solo su información, nunca la de otra"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] dark:bg-[#0A0F1E] dark:text-[#F9FAFB] font-poppins transition-colors duration-300">
      
      {/* 1. Navbar */}
      <nav className="fixed w-full z-50 bg-white/90 shadow-sm dark:shadow-none dark:bg-[#0A0F1E]/80 backdrop-blur-md border-b border-transparent dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <img src="/logo.png" alt="Fastory" className="h-8 w-auto" />
              <span className="text-[#F97316] font-poppins font-bold text-[22px] tracking-tight lowercase">fastory</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#caracteristicas" onClick={(e) => scrollToSection(e, 'caracteristicas')} className="text-[#1F2937] hover:text-[#F97316] dark:text-gray-400 dark:hover:text-[#F97316] font-medium transition-colors">Características</a>
              <a href="#como-funciona" onClick={(e) => scrollToSection(e, 'como-funciona')} className="text-[#1F2937] hover:text-[#F97316] dark:text-gray-400 dark:hover:text-[#F97316] font-medium transition-colors">Cómo funciona</a>
              <a href="#precios" onClick={(e) => scrollToSection(e, 'precios')} className="text-[#1F2937] hover:text-[#F97316] dark:text-gray-400 dark:hover:text-[#F97316] font-medium transition-colors">Precios</a>
              <a href="#contacto" onClick={(e) => scrollToSection(e, 'contacto')} className="text-[#1F2937] hover:text-[#F97316] dark:text-gray-400 dark:hover:text-[#F97316] font-medium transition-colors">Contacto</a>
              
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <Link to="/auth?tab=register" className="bg-[#F97316] hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 shadow-md shadow-orange-500/20">
                Empezar gratis
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-300">
                {isDark ? <Sun size={24} /> : <Moon size={24} />}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300">
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#FFFFFF] dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 animate-fade-in">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <a href="#caracteristicas" onClick={(e) => scrollToSection(e, 'caracteristicas')} className="block px-3 py-3 rounded-md text-base font-medium text-[#1F2937] dark:text-gray-300 hover:text-[#F97316] dark:hover:text-[#F97316] hover:bg-gray-50 dark:hover:bg-gray-800/50">Características</a>
              <a href="#como-funciona" onClick={(e) => scrollToSection(e, 'como-funciona')} className="block px-3 py-3 rounded-md text-base font-medium text-[#1F2937] dark:text-gray-300 hover:text-[#F97316] dark:hover:text-[#F97316] hover:bg-gray-50 dark:hover:bg-gray-800/50">Cómo funciona</a>
              <a href="#precios" onClick={(e) => scrollToSection(e, 'precios')} className="block px-3 py-3 rounded-md text-base font-medium text-[#1F2937] dark:text-gray-300 hover:text-[#F97316] dark:hover:text-[#F97316] hover:bg-gray-50 dark:hover:bg-gray-800/50">Precios</a>
              <a href="#contacto" onClick={(e) => scrollToSection(e, 'contacto')} className="block px-3 py-3 rounded-md text-base font-medium text-[#1F2937] dark:text-gray-300 hover:text-[#F97316] dark:hover:text-[#F97316] hover:bg-gray-50 dark:hover:bg-gray-800/50">Contacto</a>
              <div className="pt-4">
                <Link to="/auth?tab=register" className="block w-full text-center bg-[#F97316] text-white px-5 py-3 rounded-full font-medium hover:bg-orange-600 transition-colors">
                  Empezar gratis
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video / Gradient */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-orange-500 via-orange-400 to-white dark:bg-transparent">
          <video 
            className="hidden dark:block w-full h-full object-cover"
            autoPlay 
            muted 
            loop 
            playsInline
          >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
          </video>
          {/* Overlay oscuro 60% solo en modo oscuro */}
          <div className="hidden dark:block absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-slide-up mt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20 text-white text-sm font-medium mb-8 drop-shadow-sm dark:drop-shadow-none">
            <span className="text-white dark:text-[#F97316]">✦</span> 3 meses gratis para nuevas bodegas
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-md dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-[#F97316] dark:drop-shadow-sm">
            Controla tu bodega. <br className="hidden md:block" /> Vende más. Pierde menos.
          </h1>
          
          <p className="text-lg md:text-xl text-[#1F2937] dark:text-gray-200 mb-10 max-w-3xl mx-auto font-medium dark:font-light leading-relaxed">
            Fastory es el sistema de gestión de inventario diseñado para bodegas peruanas. Registra entradas, salidas, lotes y vencimientos desde cualquier dispositivo.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?tab=register" className="w-full sm:w-auto bg-white text-[#F97316] hover:bg-gray-50 dark:bg-[#F97316] dark:hover:bg-orange-600 dark:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-md dark:shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              Comenzar prueba gratis
            </Link>
            <Link to="/auth?tab=register" className="w-full sm:w-auto bg-transparent border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937]/5 dark:border-white dark:text-white dark:hover:bg-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-all backdrop-blur-sm">
              Ver demo
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Sección Características */}
      <section id="caracteristicas" className="py-24 bg-[#FAFAFA] dark:bg-[#0A0F1E] transition-colors duration-300 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#111827] dark:text-white">Todo lo que necesitas para tu bodega</h2>
            <p className="text-[#6B7280] dark:text-gray-400 text-lg">Herramientas simples y poderosas para tomar el control total de tu inventario.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-[#FFFFFF] dark:bg-[#111827] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-[#F97316]/50 dark:hover:border-[#F97316]/50 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 group"
              >
                <div className="mb-6 p-4 bg-orange-50 dark:bg-[#F97316]/10 inline-block rounded-xl group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#111827] dark:text-white">{feature.title}</h3>
                <p className="text-[#6B7280] dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Sección Cómo funciona */}
      <section id="como-funciona" className="py-24 bg-white dark:bg-[#1F2937] transition-colors duration-300 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#111827] dark:text-white">Empieza en minutos, no en días</h2>
            <p className="text-[#6B7280] dark:text-gray-400 text-lg">Un proceso diseñado para que no pierdas tiempo y empieces a operar hoy mismo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Línea conectora animada (solo desktop) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden">
              <div className="w-1/4 h-full bg-gradient-to-r from-transparent via-[#F97316] to-transparent animate-data-flow shadow-[0_0_10px_#F97316]"></div>
            </div>

            <div className="relative text-center z-10">
              <div className="w-24 h-24 mx-auto bg-[#FFFFFF] dark:bg-[#111827] border-4 border-[#F97316] rounded-full flex items-center justify-center text-4xl font-black text-[#F97316] mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#111827] dark:text-white">Regístrate en 2 minutos</h3>
              <p className="text-[#6B7280] dark:text-gray-400">Sin tarjeta de crédito, sin instalación. Crea tu cuenta al instante.</p>
            </div>

            <div className="relative text-center z-10">
              <div className="w-24 h-24 mx-auto bg-[#FFFFFF] dark:bg-[#111827] border-4 border-[#F97316] rounded-full flex items-center justify-center text-4xl font-black text-[#F97316] mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#111827] dark:text-white">Configura tu bodega</h3>
              <p className="text-[#6B7280] dark:text-gray-400">Agrega productos, categorías, repisas y proveedores fácilmente.</p>
            </div>

            <div className="relative text-center z-10">
              <div className="w-24 h-24 mx-auto bg-[#FFFFFF] dark:bg-[#111827] border-4 border-[#F97316] rounded-full flex items-center justify-center text-4xl font-black text-[#F97316] mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#111827] dark:text-white">Empieza a operar</h3>
              <p className="text-[#6B7280] dark:text-gray-400">Registra movimientos y genera reportes desde el día 1.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Sección Precios */}
      <section id="precios" className="py-24 bg-[#FAFAFA] dark:bg-[#0A0F1E] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#111827] dark:text-white">Precios simples y transparentes</h2>
            <p className="text-[#6B7280] dark:text-gray-400 text-lg">Empieza gratis y paga solo si Fastory realmente aporta valor a tu negocio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Prueba */}
            <div className="bg-[#FFFFFF] dark:bg-[#111827] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 flex flex-col relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl z-10 hover:z-20">
              <div className="absolute top-6 right-6 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold px-3 py-1 rounded-full">
                GRATIS
              </div>
              <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-2">Plan Prueba</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-[#111827] dark:text-white">S/ 0</span>
                <span className="text-[#6B7280] dark:text-gray-400 font-medium">por 90 días</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-[#6B7280] dark:text-gray-300">
                  <span className="text-[#F97316] mr-3 font-bold">✓</span> Acceso completo al sistema
                </li>
                <li className="flex items-center text-[#6B7280] dark:text-gray-300">
                  <span className="text-[#F97316] mr-3 font-bold">✓</span> Sin compromisos
                </li>
                <li className="flex items-center text-[#6B7280] dark:text-gray-300">
                  <span className="text-[#F97316] mr-3 font-bold">✓</span> Usuarios ilimitados
                </li>
              </ul>
              <Link to="/auth?tab=register" className="block w-full text-center py-4 rounded-xl font-bold text-[#111827] dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Empezar ahora
              </Link>
            </div>

            {/* Plan Activo */}
            <div className="bg-[#FFFFFF] dark:bg-[#1F2937] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 flex flex-col relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl z-10 hover:z-20">
              <div className="absolute top-0 inset-x-0 h-1 bg-[#F97316]"></div>
              <div className="absolute top-6 right-6 bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">
                MÁS POPULAR
              </div>
              <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-2">Plan Activo</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-extrabold text-[#111827] dark:text-white">S/ 11</span>
                <span className="text-[#6B7280] dark:text-gray-400 font-medium">/ mes</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-[#6B7280] dark:text-gray-300">
                  <span className="text-[#F97316] mr-3 font-bold">✓</span> Acceso completo al sistema
                </li>
                <li className="flex items-center text-[#6B7280] dark:text-gray-300">
                  <span className="text-[#F97316] mr-3 font-bold">✓</span> Soporte prioritario
                </li>
                <li className="flex items-center text-[#6B7280] dark:text-gray-300">
                  <span className="text-[#F97316] mr-3 font-bold">✓</span> Respaldo diario de datos
                </li>
                <li className="flex items-center text-[#6B7280] dark:text-gray-300">
                  <span className="text-[#F97316] mr-3 font-bold">✓</span> Actualizaciones gratuitas
                </li>
              </ul>
              <Link to="/auth?tab=register" className="block w-full text-center py-4 rounded-xl font-bold text-white bg-[#F97316] hover:bg-orange-600 transition-colors shadow-md">
                Empezar ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Sección CTA Final */}
      <section className="py-20 bg-[#F97316] relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            ¿Listo para ordenar tu bodega?
          </h2>
          <p className="text-xl text-orange-50 mb-10 max-w-2xl mx-auto">
            Únete a las bodegas peruanas que ya controlan su inventario con Fastory.
          </p>
          <Link to="/auth?tab=register" className="inline-block bg-white text-[#F97316] hover:bg-gray-50 px-10 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-xl">
            Comenzar gratis hoy
          </Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer id="contacto" className="bg-[#FFFFFF] dark:bg-[#0A0F1E] border-t border-gray-200 dark:border-gray-800 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <span className="text-[#F97316] font-bold text-2xl">Fastory</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <a href="#" className="text-[#6B7280] hover:text-[#F97316] dark:text-gray-400 transition-colors text-sm font-medium">Términos y Condiciones</a>
            <a href="#" className="text-[#6B7280] hover:text-[#F97316] dark:text-gray-400 transition-colors text-sm font-medium">Políticas de Privacidad</a>
            <a href="mailto:contacto@fastory.pe" className="text-[#6B7280] hover:text-[#F97316] dark:text-gray-400 transition-colors text-sm font-medium">Contacto</a>
          </div>
          
          <div className="text-[#6B7280] dark:text-gray-500 text-sm font-medium">
            © 2026 Fastory. Hecho en Perú 🇵🇪
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
