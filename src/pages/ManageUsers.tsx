import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserPlus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { UserService, UserDto, UserPayload } from "@/api/userService";
import { RoleService, Rol } from "@/api/roleService";

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

  // Cargar usuarios y roles al inicio
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
        password: "", // Contraseña vacía al editar
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
      // Solo enviar password si se escribió algo
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
      fetchData(); // Recargar lista
      setDialogOpen(false);
    } catch (error: any) {
      let msg = "Error al guardar usuario";
      try {
        const json = JSON.parse(error.message);
        msg = json.error || json.message || msg;
      } catch (e) {
        msg = error.message || msg;
      }

      // En producción, los errores de duplicidad a veces retornan 500
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
    <div className="min-h-screen bg-background flex">
      <div className="flex flex-1">
        <Sidebar activeSection="administrar-usuarios" />

        <main className="flex-1 overflow-y-auto animate-fade-in">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <div className="lg:ml-0 ml-14">
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                      Administrar Usuarios
                    </h1>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                  Gestiona los usuarios y roles del sistema
                </p>
              </div>

              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o usuario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => handleOpenDialog()}
                        className="gap-2 h-11 px-6"
                      >
                        <UserPlus className="w-4 h-4" />
                        Nuevo Usuario
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingUser
                            ? "Modifica los datos del usuario"
                            : "Complete los datos para crear un nuevo usuario"}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName">Nombre *</Label>
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    firstName: e.target.value,
                                  })
                                }
                                placeholder="Ej: Juan"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName">Apellido *</Label>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    lastName: e.target.value,
                                  })
                                }
                                placeholder="Ej: Pérez"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="username">Usuario *</Label>
                            <Input
                              id="username"
                              value={formData.username}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  username: e.target.value,
                                })
                              }
                              placeholder="Ej: jperez"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Gmail *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Ej: usuario@gmail.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">
                              Contraseña{" "}
                              {editingUser
                                ? "(dejar en blanco para mantener)"
                                : "*"}
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  password: e.target.value,
                                })
                              }
                              placeholder="••••••••"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Rol *</Label>
                            <Select
                              value={formData.idRol}
                              onValueChange={(value) =>
                                setFormData({ ...formData, idRol: value })
                              }
                            >
                              <SelectTrigger id="role">
                                <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredRoles.map((role) => (
                                  <SelectItem
                                    key={role.idRol}
                                    value={role.idRol.toString()}
                                  >
                                    {role.nombreRol}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full sm:w-auto">
                            {editingUser ? "Actualizar" : "Crear Usuario"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre Completo</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="flex justify-center items-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                              Cargando usuarios...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No se encontraron usuarios
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.idUsuario}>
                            <TableCell className="font-medium">
                              {user.nombre} {user.apellido}
                            </TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  user.nombreRol === "ADMINISTRADOR"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {user.nombreRol}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenDialog(user)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteClick(user.idUsuario)
                                  }
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de eliminar este usuario? Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageUsers;
