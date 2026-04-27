import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserPlus, Pencil, Trash2, Search, Loader2, Mail, ShieldAlert } from "lucide-react";
import { UserService, UserDto, UserPayload } from "@/api/userService";
import { RoleService, Rol } from "@/api/roleService";
import AppHeader from "@/components/AppHeader"; // <-- Import AppHeader

const ManageUsers = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    idRol: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => { 
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        UserService.list(),
        RoleService.list(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      toast.error("Error al cargar datos del sistema");
    } finally {
      setIsLoading(false);
    }
  };

  const currentUserString = localStorage.getItem("user");
  const currentUser = currentUserString ? JSON.parse(currentUserString) : null;

  const filteredRoles = roles.filter(role => {
    if (currentUser?.rol === "ADMINISTRADOR" && role.nombreRol === "ADMINISTRADOR") {
      return false;
    }
    return true;
  });

  const filteredUsers = users.filter(
    (user) =>
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (user?: UserDto) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.nombre,
        lastName: user.apellido,
        username: user.username,
        email: user.email || "",
        password: "",
        idRol: user.idRol.toString(),
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        idRol: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.username ||
      !formData.email ||
      (!editingUser && !formData.password) ||
      !formData.idRol
    ) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    if (!formData.email.endsWith("@gmail.com")) {
      toast.error("El correo debe ser @gmail.com");
      return;
    }

    const payload: UserPayload = {
      nombre: formData.firstName,
      apellido: formData.lastName,
      username: formData.username,
      email: formData.email,
      idRol: parseInt(formData.idRol),
      password: formData.password ? formData.password : undefined,
    };

    try {
      if (editingUser) {
        await UserService.update(editingUser.idUsuario, payload);
        toast.success(`Usuario ${payload.username} actualizado correctamente`);
      } else {
        await UserService.create(payload);
        toast.success(`Usuario ${payload.username} creado correctamente`);
      }
      fetchData();
      setDialogOpen(false);
    } catch (error: any) {
      let msg = "Error al guardar usuario";
      try {
        const json = JSON.parse(error.message);
        msg = json.error || json.message || msg;
      } catch (e) {
        msg = error.message || msg;
      }
      if (msg.includes("500") || msg.toLowerCase().includes("internal server error")) {
        msg = "Error del servidor. Es posible que el nombre de usuario ya esté en uso.";
      }
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingUserId) {
      try {
        await UserService.delete(deletingUserId);
        toast.success("Usuario eliminado correctamente");
        fetchData();
      } catch (error) {
        toast.error("No se pudo eliminar el usuario");
      }
    }
    setDeleteDialogOpen(false);
    setDeletingUserId(null);
  };

  const handleDeleteClick = (userId: number) => {
    setDeletingUserId(userId);
    setDeleteDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#F3F4F6] dark:bg-background flex sidebar-transition">
        <Sidebar activeSection="administrar-usuarios" />
        <div className="flex-1 flex flex-col min-h-screen sidebar-transition">
          <AppHeader sectionTitle="Usuarios" />
          <main className="flex-1 overflow-y-auto animate-fade-in">
            <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
              
              <div className="mb-6 lg:ml-0 ml-14 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[24px] font-bold text-[#111827] dark:text-white" style={{ fontFamily: 'Poppins,sans-serif' }}>
                    Administrar Usuarios
                  </h2>
                  <p className="text-[#6B7280] dark:text-white/50 text-[14px] mt-0.5">
                    Gestiona los usuarios y roles del sistema
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] rounded-xl shadow-sm lg:ml-0 ml-14 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F97316]" />
                
                <div className="p-5 sm:p-6 border-b border-[#E5E7EB] dark:border-[#1F2937] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 w-full sm:max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <Input
                      placeholder="Buscar por nombre o usuario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 h-[46px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] transition-all duration-200"
                    />
                  </div>
                  
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="h-[46px] px-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-[0_4px_15px_rgba(249,115,22,0.35)] hover:shadow-[0_6px_25px_rgba(249,115,22,0.55)] hover:-translate-y-[1px] transition-all duration-200 rounded-[10px] font-semibold border-none gap-2 shrink-0"
                        onClick={() => handleOpenDialog()}
                      >
                        <UserPlus className="w-4 h-4" /> Nuevo Usuario
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937] sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-[18px] font-bold text-[#111827] dark:text-white">
                          {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                        </DialogTitle>
                        <DialogDescription className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">
                          {editingUser ? "Modifica los datos del usuario" : "Complete los datos para crear un nuevo usuario"}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="relative group input-wrapper">
                            <Input
                              placeholder=" "
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              className="peer h-[50px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] transition-all duration-200"
                            />
                            <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px]">
                              Nombre *
                            </label>
                          </div>
                          <div className="relative group input-wrapper">
                            <Input
                              placeholder=" "
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              className="peer h-[50px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] transition-all duration-200"
                            />
                            <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px]">
                              Apellido *
                            </label>
                          </div>
                        </div>

                        <div className="relative group input-wrapper">
                          <Input
                            placeholder=" "
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="peer h-[50px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] transition-all duration-200"
                          />
                          <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px]">
                            Usuario (Login) *
                          </label>
                        </div>

                        <div className="relative group input-wrapper">
                          <Input
                            type="email"
                            placeholder=" "
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="peer h-[50px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] transition-all duration-200"
                          />
                          <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px]">
                            Correo Electrónico (@gmail.com) *
                          </label>
                        </div>

                        <div className="relative group input-wrapper">
                          <Input
                            type="password"
                            placeholder=" "
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="peer h-[50px] px-4 pt-5 pb-2 bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] text-[#111827] dark:text-white focus-visible:ring-0 focus-visible:border-[#F97316] rounded-[10px] shadow-none focus-visible:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] focus-visible:-translate-y-[1px] transition-all duration-200"
                          />
                          <label className="absolute left-4 top-3 -translate-y-1/2 scale-[0.85] -translate-x-1 text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none transition-all duration-200 transform origin-left peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-x-0 peer-focus:top-3 peer-focus:scale-[0.85] peer-focus:-translate-x-1 peer-focus:text-[#F97316] text-[13px]">
                            {editingUser ? "Contraseña (dejar en blanco para mantener)" : "Contraseña *"}
                          </label>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <label className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] pl-1">Rol *</label>
                          <Select value={formData.idRol} onValueChange={(value) => setFormData({ ...formData, idRol: value })}>
                            <SelectTrigger className="h-[50px] bg-[#F9FAFB] dark:bg-[#0A0F1E]/50 border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                              <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
                              {filteredRoles.map((role) => (
                                <SelectItem key={role.idRol} value={role.idRol.toString()}>{role.nombreRol}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <DialogFooter className="pt-4 mt-4 border-t border-[#E5E7EB] dark:border-[#1F2937]">
                          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-[46px] border-[#E5E7EB] dark:border-[#1F2937] rounded-[10px]">
                            Cancelar
                          </Button>
                          <Button type="submit" className="h-[46px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-[10px] font-semibold border-none">
                            {editingUser ? "Actualizar Usuario" : "Crear Usuario"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="p-5 sm:p-6 bg-[#F9FAFB]/50 dark:bg-transparent">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {isLoading ? (
                       <div className="col-span-full py-12 flex justify-center items-center">
                         <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
                       </div>
                    ) : filteredUsers.length === 0 ? (
                       <div className="col-span-full py-12 text-center">
                         <Users className="w-12 h-12 text-[#D1D5DB] dark:text-[#374151] mx-auto mb-3" />
                         <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">No se encontraron usuarios.</p>
                       </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.idUsuario}
                          className="group bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#F97316]/50 dark:hover:border-[#F97316]/50 rounded-[12px] p-4 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-col relative overflow-hidden"
                        >
                          <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-colors ${user.nombreRol === "ADMINISTRADOR" ? "bg-red-500" : "bg-blue-500"}`}></div>
                          
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center shrink-0 border border-white dark:border-white/5 shadow-sm text-lg font-bold text-[#6B7280] dark:text-white/60 uppercase">
                              {user.nombre.charAt(0)}{user.apellido.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <h3 className="font-bold text-[15px] text-[#111827] dark:text-white truncate leading-tight">
                                {user.nombre} {user.apellido}
                              </h3>
                              <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] mb-1.5">@{user.username}</p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${user.nombreRol === "ADMINISTRADOR" ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"}`}>
                                {user.nombreRol === "ADMINISTRADOR" && <ShieldAlert className="w-3 h-3 mr-1" />}
                                {user.nombreRol}
                              </span>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#1F2937] flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] dark:text-[#9CA3AF] truncate">
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex gap-1 shrink-0 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-[#6B7280] hover:text-[#F97316] hover:bg-[#F97316]/10 rounded-md"
                                onClick={() => handleOpenDialog(user)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-[#6B7280] hover:text-red-500 hover:bg-red-500/10 rounded-md"
                                onClick={() => handleDeleteClick(user.idUsuario)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1F2937]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] dark:text-white">Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
              ¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E7EB] dark:border-[#1F2937]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default ManageUsers;
