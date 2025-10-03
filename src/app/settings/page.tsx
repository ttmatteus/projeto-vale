"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAppToast } from "@/hooks/use-app-toast";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield,
  Database,
  Building2,
  Grid3X3,
  Trash2,
  User,
  Calendar,
  Edit,
  Plus,
  Copy,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/hooks/use-auth";

interface Empreendimento {
  id: string;
  nome: string;
  descricao: string;
  endereco: string;
  cidade: string;
  estado: string;
  areaTotal: string;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface Quadra {
  id: string;
  nome: string;
  empreendimentoId: string;
  empreendimento: {
    id: string;
    nome: string;
    descricao?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    areaTotal?: number;
    areaUtil?: number;
    quantidadeLotes?: number;
    valorTotal?: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    deletedBy?: string;
  };
  areaTotal?: number;
  quantidadeLotes?: number;
  valorMetroQuadrado?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface Usuario {
  id: string;
  name: string;
  identifier: string;
  email?: string;
  creci?: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

interface PaymentCondition {
  id: string;
  nome: string;
  porcentagens: number[]; // Array de porcentagens disponíveis
  status: "ATIVO" | "INATIVO";
  createdAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export default function SettingsPage() {
  const { creci, logout, jwtToken, isAdmin } = useAuth();
  const { showSuccess, showError } = useAppToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  
  // JWT Token states
  const [showToken, setShowToken] = useState(false);

  // Estados para edição de empreendimentos
  const [editingEmpreendimento, setEditingEmpreendimento] = useState<Empreendimento | null>(null);
  const [isEditEmpreendimentoDialogOpen, setIsEditEmpreendimentoDialogOpen] = useState(false);
  const [empreendimentoFormData, setEmpreendimentoFormData] = useState({
    nome: "",
    descricao: "",
    endereco: "",
    cidade: "",
    estado: "",
    areaTotal: ""
  });

  // Estados para edição de quadras
  const [editingQuadra, setEditingQuadra] = useState<Quadra | null>(null);
  const [isEditQuadraDialogOpen, setIsEditQuadraDialogOpen] = useState(false);
  const [quadraFormData, setQuadraFormData] = useState({
    nome: "",
    empreendimento: ""
  });

  // Estados para edição de usuários
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [isEditUsuarioDialogOpen, setIsEditUsuarioDialogOpen] = useState(false);
  const [usuarioFormData, setUsuarioFormData] = useState({
    name: "",
    identifier: "",
    email: "",
    creci: "",
    password: "",
    role: "USER" as "ADMIN" | "USER",
    isActive: true
  });

  // Estados para edição de condições de pagamento
  const [editingPaymentCondition, setEditingPaymentCondition] = useState<PaymentCondition | null>(null);
  const [isEditPaymentConditionDialogOpen, setIsEditPaymentConditionDialogOpen] = useState(false);
  const [paymentConditionFormData, setPaymentConditionFormData] = useState({
    nome: "",
    porcentagens: [10], // Array com porcentagem padrão
    status: "ATIVO" as "ATIVO" | "INATIVO"
  });
  const [isLoadingPaymentConditions, setIsLoadingPaymentConditions] = useState(false);

  // Carregar dados do banco de dados
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);

  const [quadras, setQuadras] = useState<Quadra[]>([]);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Carregar condições de pagamento do banco de dados
  const [paymentConditions, setPaymentConditions] = useState<PaymentCondition[]>([]);

  // Estado para configurações do sistema
  const [systemSettings, setSystemSettings] = useState({
    company: "Vale Empreendimentos",
    description: "Sistema completo para gestão de lotes, clientes e transações em Vale Empreendimentos",
    externalReserveLink: "https://wa.me/5511999999999?text=Olá! Gostaria de reservar um lote.",
    reservationDays: 3
  });

  // useEffect para carregar dados do banco de dados
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar configurações do sistema
        const systemSettingsResponse = await fetch('/api/system-settings');
        if (systemSettingsResponse.ok) {
          const systemSettingsData = await systemSettingsResponse.json();
          
          setSystemSettings({
            company: systemSettingsData.nomeSistema || "Vale Empreendimentos",
            description: "Sistema completo para gestão de lotes, clientes e transações em Vale Empreendimentos",
            externalReserveLink: systemSettingsData.externalReserveLink || "https://wa.me/5511999999999?text=Olá! Gostaria de reservar um lote.",
            reservationDays: systemSettingsData.reservationDays || 3
          });
        }

        // Carregar empreendimentos
        const empreendimentosResponse = await fetch('/api/empreendimentos');
        if (empreendimentosResponse.ok) {
          const empreendimentosData = await empreendimentosResponse.json();
          setEmpreendimentos(empreendimentosData);
        }

        // Carregar quadras
        const quadrasResponse = await fetch('/api/quadras');
        if (quadrasResponse.ok) {
          const quadrasData = await quadrasResponse.json();
          setQuadras(quadrasData);
        }

        // Carregar usuários
        const usuariosResponse = await fetch('/api/users');
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          setUsuarios(usuariosData);
        }

        // Carregar condições de pagamento
        const paymentConditionsResponse = await fetch('/api/payment-conditions');
        if (paymentConditionsResponse.ok) {
          const paymentConditionsData = await paymentConditionsResponse.json();
          setPaymentConditions(paymentConditionsData);
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, []);

  // JWT Token functions
  const handleCopyToken = async () => {
    if (jwtToken) {
      try {
        await navigator.clipboard.writeText(jwtToken);
        showSuccess("Token copiado", "O token JWT foi copiado para a área de transferência.");
      } catch (error) {
        showError("Erro ao copiar", "Não foi possível copiar o token.");
      }
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Salvar configurações do sistema no banco de dados
      const payload = {
        company: systemSettings.company,
        description: systemSettings.description,
        externalReserveLink: systemSettings.externalReserveLink,
        reservationDays: systemSettings.reservationDays,
      };
      
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações do sistema');
      }

      // Simulate API call for other settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mostrar toast de sucesso
      showSuccess("Configurações salvas", "As configurações do sistema foram atualizadas com sucesso.");
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      
      // Mostrar toast de erro
      showError("Erro ao salvar", "Não foi possível salvar as configurações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmpreendimento = async (id: string) => {
    try {
      const response = await fetch(`/api/empreendimentos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEmpreendimentos(prev => prev.filter(emp => emp.id !== id));
      } else {
        const error = await response.json();
        alert(`Erro ao deletar empreendimento: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao deletar empreendimento:', error);
      alert('Erro ao deletar empreendimento. Tente novamente.');
    }
  };

  const handleDeleteQuadra = async (id: string) => {
    try {
      const response = await fetch(`/api/quadras/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuadras(prev => prev.filter(quadra => quadra.id !== id));
      } else {
        const error = await response.json();
        alert(`Erro ao deletar quadra: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao deletar quadra:', error);
      alert('Erro ao deletar quadra. Tente novamente.');
    }
  };

  // Funções para edição de empreendimentos
  const handleEditEmpreendimento = (empreendimento: Empreendimento) => {
    setEditingEmpreendimento(empreendimento);
    setEmpreendimentoFormData({
      nome: empreendimento.nome,
      descricao: empreendimento.descricao,
      endereco: empreendimento.endereco,
      cidade: empreendimento.cidade,
      estado: empreendimento.estado,
      areaTotal: empreendimento.areaTotal
    });
    setIsEditEmpreendimentoDialogOpen(true);
  };

  const handleSaveEmpreendimento = async () => {
    if (editingEmpreendimento) {
      try {
        const response = await fetch(`/api/empreendimentos/${editingEmpreendimento.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: empreendimentoFormData.nome,
            descricao: empreendimentoFormData.descricao,
            endereco: empreendimentoFormData.endereco,
            cidade: empreendimentoFormData.cidade,
            estado: empreendimentoFormData.estado,
            areaTotal: empreendimentoFormData.areaTotal ? parseFloat(empreendimentoFormData.areaTotal) : undefined,
          }),
        });

        if (response.ok) {
          const updatedEmpreendimento = await response.json();
          setEmpreendimentos(prev => 
            prev.map(emp => emp.id === editingEmpreendimento.id ? updatedEmpreendimento : emp)
          );
          setIsEditEmpreendimentoDialogOpen(false);
          setEditingEmpreendimento(null);
        } else {
          const error = await response.json();
          alert(`Erro ao atualizar empreendimento: ${error.error}`);
        }
      } catch (error) {
        console.error('Erro ao atualizar empreendimento:', error);
        alert('Erro ao atualizar empreendimento. Tente novamente.');
      }
    }
  };

  // Funções para edição de quadras
  const handleEditQuadra = (quadra: Quadra) => {
    setEditingQuadra(quadra);
    setQuadraFormData({
      nome: quadra.nome,
      empreendimento: quadra.empreendimentoId
    });
    setIsEditQuadraDialogOpen(true);
  };

  const handleSaveQuadra = async () => {
    if (editingQuadra) {
      try {
        const response = await fetch(`/api/quadras/${editingQuadra.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: quadraFormData.nome,
            empreendimentoId: quadraFormData.empreendimento,
          }),
        });

        if (response.ok) {
          const updatedQuadra = await response.json();
          setQuadras(prev => 
            prev.map(q => q.id === editingQuadra.id ? updatedQuadra : q)
          );
          setIsEditQuadraDialogOpen(false);
          setEditingQuadra(null);
        } else {
          const error = await response.json();
          alert(`Erro ao atualizar quadra: ${error.error}`);
        }
      } catch (error) {
        console.error('Erro ao atualizar quadra:', error);
        alert('Erro ao atualizar quadra. Tente novamente.');
      }
    }
  };

  // Funções para edição de usuários
  const handleEditUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setUsuarioFormData({
      name: usuario.name,
      identifier: usuario.identifier,
      email: usuario.email || "",
      creci: usuario.creci || "",
      password: "",
      role: usuario.role,
      isActive: usuario.isActive
    });
    setIsEditUsuarioDialogOpen(true);
  };

  const handleCreateUsuario = () => {
    setEditingUsuario(null);
    setUsuarioFormData({
      name: "",
      identifier: "",
      email: "",
      creci: "",
      password: "",
      role: "USER",
      isActive: true
    });
    setIsEditUsuarioDialogOpen(true);
  };

  const handleSaveUsuario = async () => {
    try {
      if (editingUsuario) {
        // Editar usuário existente
        const response = await fetch(`/api/users/${editingUsuario.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: usuarioFormData.name,
            identifier: usuarioFormData.identifier,
            email: usuarioFormData.email || undefined,
            creci: usuarioFormData.creci || undefined,
            password: usuarioFormData.password || undefined,
            role: usuarioFormData.role,
            isActive: usuarioFormData.isActive,
          }),
        });

        if (response.ok) {
          const updatedUsuario = await response.json();
          setUsuarios(prev => 
            prev.map(u => u.id === editingUsuario.id ? updatedUsuario : u)
          );
        } else {
          const error = await response.json();
          alert(`Erro ao atualizar usuário: ${error.error}`);
          return;
        }
      } else {
        // Criar novo usuário
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: usuarioFormData.name,
            identifier: usuarioFormData.identifier,
            email: usuarioFormData.email,
            creci: usuarioFormData.creci,
            password: usuarioFormData.password,
            role: usuarioFormData.role,
            isActive: usuarioFormData.isActive,
          }),
        });

        if (response.ok) {
          const novoUsuario = await response.json();
          setUsuarios(prev => [...prev, novoUsuario]);
        } else {
          const error = await response.json();
          alert(`Erro ao criar usuário: ${error.error}`);
          return;
        }
      }
      
      setIsEditUsuarioDialogOpen(false);
      setEditingUsuario(null);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário. Tente novamente.');
    }
  };

  const handleDeleteUsuario = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
      } else {
        const error = await response.json();
        alert(`Erro ao deletar usuário: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário. Tente novamente.');
    }
  };

  // Funções para edição de condições de pagamento
  const handleEditPaymentCondition = (condition: PaymentCondition) => {
    setEditingPaymentCondition(condition);
    setPaymentConditionFormData({
      nome: condition.nome,
      porcentagens: [...condition.porcentagens],
      status: condition.status
    });
    setIsEditPaymentConditionDialogOpen(true);
  };

  const handleCreatePaymentCondition = () => {
    setEditingPaymentCondition(null);
    setPaymentConditionFormData({
      nome: "",
      porcentagens: [10], // Valor padrão inicial
      status: "ATIVO"
    });
    setIsEditPaymentConditionDialogOpen(true);
  };

  const handleSavePaymentCondition = async () => {
    try {
      const url = editingPaymentCondition 
        ? `/api/payment-conditions/${editingPaymentCondition.id}`
        : '/api/payment-conditions';
      
      const method = editingPaymentCondition ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: paymentConditionFormData.nome,
          porcentagens: paymentConditionFormData.porcentagens,
          status: paymentConditionFormData.status
        })
      });

      if (response.ok) {
        const savedCondition = await response.json();
        
        if (editingPaymentCondition) {
          // Atualizar a condição na lista
          setPaymentConditions(prev => 
            prev.map(condition => 
              condition.id === editingPaymentCondition.id 
                ? savedCondition
                : condition
            )
          );
        } else {
          // Adicionar nova condição à lista
          setPaymentConditions(prev => [...prev, savedCondition]);
        }
        
        setIsEditPaymentConditionDialogOpen(false);
        setEditingPaymentCondition(null);
      } else {
        console.error('Erro ao salvar condição de pagamento');
      }
    } catch (error) {
      console.error('Erro ao salvar condição de pagamento:', error);
    }
  };

  const handleDeletePaymentCondition = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-conditions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Remover a condição da lista (ou marcar como deletada se for soft delete)
        setPaymentConditions(prev => 
          prev.filter(condition => condition.id !== id)
        );
      } else {
        console.error('Erro ao excluir condição de pagamento');
      }
    } catch (error) {
      console.error('Erro ao excluir condição de pagamento:', error);
    }
  };

  const activeEmpreendimentos = empreendimentos.filter(emp => !emp.deletedAt).sort((a, b) => a.nome.localeCompare(b.nome));
  const activeQuadras = quadras.filter(quadra => !quadra.deletedAt).sort((a, b) => a.nome.localeCompare(b.nome));
  const activeUsuarios = usuarios.filter(usuario => !usuario.deletedAt).sort((a, b) => a.name.localeCompare(b.name));
  const activePaymentConditions = paymentConditions.filter(condition => !condition.deletedAt).sort((a, b) => a.nome.localeCompare(b.nome));
  const deletedEmpreendimentos = empreendimentos.filter(emp => emp.deletedAt);
  const deletedQuadras = quadras.filter(quadra => quadra.deletedAt);

  const getRoleBadge = (papel: string) => {
    switch (papel) {
      case "ADMIN":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>;
      case "USER":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Usuário</Badge>;
      default:
        return <Badge variant="outline">{papel}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inativo</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <AuthGuard requireAdmin={true}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                  <p className="text-muted-foreground">
                    Gerencie as preferências do sistema
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="general">Geral</TabsTrigger>
                  <TabsTrigger value="permissions">Pessoas & Permissões</TabsTrigger>
                  <TabsTrigger value="payment">Condições de Pagamento</TabsTrigger>


                </TabsList>

                <TabsContent value="general">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações do Sistema</CardTitle>
                        <CardDescription>
                          Configurações básicas do sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-1">
                          <div className="space-y-2">
                            <Label htmlFor="company">Nome da Empresa</Label>
                            <Input 
                              id="company" 
                              value={systemSettings.company}
                              onChange={(e) => setSystemSettings(prev => ({ ...prev, company: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Descrição da empresa..."
                            value={systemSettings.description}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="externalReserveLink">Link Externo para Reserva</Label>
                          <Input 
                            id="externalReserveLink" 
                            placeholder="https://wa.me/5511999999999?text=Olá! Gostaria de reservar um lote."
                            value={systemSettings.externalReserveLink}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, externalReserveLink: e.target.value }))}
                          />
                          <p className="text-sm text-muted-foreground">
                            Link utilizado para redirecionar usuários quando clicam em "Reservar"
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reservationDays">Dias que a Reserva ficará Disponível</Label>
                          <Input 
                            id="reservationDays" 
                            type="number"
                            min="1"
                            max="30"
                            value={systemSettings.reservationDays}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, reservationDays: parseInt(e.target.value) || 3 }))}
                          />
                          <p className="text-sm text-muted-foreground">
                            Número de dias que uma reserva ficará disponível antes de expirar
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Empreendimentos</CardTitle>
                        <CardDescription>
                          Gerencie os empreendimentos cadastrados no sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Empreendimento</TableHead>
                              <TableHead>Cidade</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Área Total</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeEmpreendimentos.map((empreendimento) => (
                              <TableRow key={empreendimento.id}>
                                <TableCell className="font-medium">{empreendimento.nome}</TableCell>
                                <TableCell>{empreendimento.cidade}</TableCell>
                                <TableCell>{empreendimento.estado}</TableCell>
                                <TableCell>{empreendimento.areaTotal} m²</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditEmpreendimento(empreendimento)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Excluir Empreendimento</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja excluir o empreendimento "{empreendimento.nome}"? Esta ação pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteEmpreendimento(empreendimento.id)}>
                                            Excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quadras</CardTitle>
                        <CardDescription>
                          Gerencie as quadras cadastradas no sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Empreendimento</TableHead>
                              <TableHead>Quadra</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeQuadras.map((quadra) => {
                              const nomeEmpreendimento = quadra.empreendimento?.nome || 'Desconhecido';
                              
                              return (
                                <TableRow key={quadra.id}>
                                  <TableCell>{nomeEmpreendimento}</TableCell>
                                  <TableCell className="font-medium">{quadra.nome}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => handleEditQuadra(quadra)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="outline" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Quadra</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Tem certeza que deseja excluir a quadra "{quadra.nome}"? Esta ação pode ser desfeita.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteQuadra(quadra.id)}>
                                              Excluir
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="permissions">
                  <div className="grid gap-6">
                    {/* JWT Token Section - Only visible to administrators */}
                    {isAdmin && jwtToken && (
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Token de Acesso JWT
                              </CardTitle>
                              <CardDescription>
                                Token JWT para acesso à API. Mantenha este token seguro e não compartilhe com terceiros.
                              </CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleCopyToken}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar Token
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="relative">
                              <Label htmlFor="jwt-token">Token JWT</Label>
                              <div className="relative mt-1">
                                <Input
                                  id="jwt-token"
                                  type={showToken ? "text" : "password"}
                                  value={jwtToken}
                                  readOnly
                                  className="pr-10 font-mono text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowToken(!showToken)}
                                >
                                  {showToken ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p><strong>Atenção:</strong> Este token concede acesso total à API. Utilize-o apenas em ambientes seguros e para integrações autorizadas.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>Gerenciar Usuários</CardTitle>
                            <CardDescription>
                              Adicione, edite ou remova usuários do sistema
                            </CardDescription>
                          </div>
                          <Button onClick={handleCreateUsuario}>
                            <User className="mr-2 h-4 w-4" />
                            Criar Usuário
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Identificador</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {activeUsuarios.map((usuario) => (
                                <TableRow key={usuario.id}>
                                  <TableCell className="font-medium">{usuario.name}</TableCell>
                                  <TableCell>{usuario.identifier}</TableCell>
                                  <TableCell>{getRoleBadge(usuario.role)}</TableCell>
                                  <TableCell>{getStatusBadge(usuario.isActive)}</TableCell>
                                  <TableCell>{formatDate(usuario.createdAt)}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => handleEditUsuario(usuario)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="outline" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Tem certeza que deseja excluir o usuário "{usuario.name}"? Esta ação pode ser desfeita.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteUsuario(usuario.id)}>
                                              Excluir
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Permissões e Níveis de Acesso</CardTitle>
                        <CardDescription>
                          Configure as permissões para cada tipo de usuário
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">Administrador</h4>
                                  <p className="text-sm text-muted-foreground">Acesso completo ao sistema</p>
                                </div>
                                <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  <span>Gerenciar todos os usuários</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  <span>Editar configurações do sistema</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  <span>Gerenciar lotes e transações</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  <span>Acesso a todos os relatórios</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">Usuário</h4>
                                  <p className="text-sm text-muted-foreground">Acesso limitado às funções básicas</p>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">Usuário</Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  <span>Visualizar lotes disponíveis</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  <span>Criar propostas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-gray-400" />
                                  <span>Gerenciar apenas seus lotes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-gray-400" />
                                  <span>Relatórios básicos</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="payment">
                  <div className="grid gap-6">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>Condições de Pagamento</CardTitle>
                            <CardDescription>
                              Gerencie as condições de pagamento disponíveis no sistema
                            </CardDescription>
                          </div>
                          <Button onClick={handleCreatePaymentCondition}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Condição
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {isLoadingPaymentConditions ? (
                            <div className="flex justify-center items-center h-32">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              <span className="ml-2 text-sm text-muted-foreground">Carregando condições de pagamento...</span>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Tipo</TableHead>
                                  <TableHead>Porcentagem</TableHead>
                                  <TableHead>Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {activePaymentConditions.map((condition) => (
                                  <TableRow key={condition.id}>
                                    <TableCell className="font-medium">{condition.nome}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {condition.porcentagens.map((porcentagem, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            {porcentagem}%
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditPaymentCondition(condition)}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Excluir Condição de Pagamento</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Tem certeza que deseja excluir a condição "{condition.nome}"? Esta ação pode ser desfeita.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeletePaymentCondition(condition.id)}>
                                                Excluir
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>




              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Dialog de Edição de Empreendimento */}
      <Dialog open={isEditEmpreendimentoDialogOpen} onOpenChange={setIsEditEmpreendimentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empreendimento</DialogTitle>
            <DialogDescription>
              Altere as informações do empreendimento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input 
                id="nome"
                value={empreendimentoFormData.nome}
                onChange={(e) => setEmpreendimentoFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea 
                id="descricao"
                value={empreendimentoFormData.descricao}
                onChange={(e) => setEmpreendimentoFormData(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input 
                id="endereco"
                value={empreendimentoFormData.endereco}
                onChange={(e) => setEmpreendimentoFormData(prev => ({ ...prev, endereco: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input 
                  id="cidade"
                  value={empreendimentoFormData.cidade}
                  onChange={(e) => setEmpreendimentoFormData(prev => ({ ...prev, cidade: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input 
                  id="estado"
                  value={empreendimentoFormData.estado}
                  onChange={(e) => setEmpreendimentoFormData(prev => ({ ...prev, estado: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaTotal">Área Total (m²)</Label>
              <Input 
                id="areaTotal"
                value={empreendimentoFormData.areaTotal}
                onChange={(e) => setEmpreendimentoFormData(prev => ({ ...prev, areaTotal: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEmpreendimento}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Quadra */}
      <Dialog open={isEditQuadraDialogOpen} onOpenChange={setIsEditQuadraDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Quadra</DialogTitle>
            <DialogDescription>
              Altere as informações da quadra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input 
                id="nome"
                value={quadraFormData.nome}
                onChange={(e) => setQuadraFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empreendimento">Empreendimento</Label>
              <Select value={quadraFormData.empreendimento} onValueChange={(value) => setQuadraFormData(prev => ({ ...prev, empreendimento: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeEmpreendimentos.map((empreendimento) => (
                    <SelectItem key={empreendimento.id} value={empreendimento.id}>
                      {empreendimento.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveQuadra}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição/Criação de Usuário */}
      <Dialog open={isEditUsuarioDialogOpen} onOpenChange={setIsEditUsuarioDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUsuario ? "Editar Usuário" : "Criar Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUsuario ? "Altere as informações do usuário" : "Preencha os dados para criar um novo usuário"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input 
                id="name"
                value={usuarioFormData.name}
                onChange={(e) => setUsuarioFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="identifier">Identificador</Label>
              <Input 
                id="identifier"
                value={usuarioFormData.identifier}
                onChange={(e) => setUsuarioFormData(prev => ({ ...prev, identifier: e.target.value }))}
                placeholder="Digite um identificador único"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creci">CRECI</Label>
              <Input 
                id="creci"
                value={usuarioFormData.creci}
                onChange={(e) => setUsuarioFormData(prev => ({ ...prev, creci: e.target.value }))}
                placeholder="Digite o CRECI do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email"
                value={usuarioFormData.email}
                onChange={(e) => setUsuarioFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Digite o e-mail do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password"
                type="password"
                value={usuarioFormData.password}
                onChange={(e) => setUsuarioFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Digite uma senha"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={usuarioFormData.role} onValueChange={(value: "ADMIN" | "USER") => setUsuarioFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="USER">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select value={usuarioFormData.isActive ? "ATIVO" : "INATIVO"} onValueChange={(value: "ATIVO" | "INATIVO") => setUsuarioFormData(prev => ({ ...prev, isActive: value === "ATIVO" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveUsuario}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Condição de Pagamento */}
      <Dialog open={isEditPaymentConditionDialogOpen} onOpenChange={setIsEditPaymentConditionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPaymentCondition ? "Editar Condição de Pagamento" : "Nova Condição de Pagamento"}</DialogTitle>
            <DialogDescription>
              {editingPaymentCondition ? "Altere as informações da condição de pagamento" : "Cadastre uma nova condição de pagamento"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input 
                id="nome"
                value={paymentConditionFormData.nome}
                onChange={(e) => setPaymentConditionFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: À Vista, Parcelado Simples"
              />
            </div>
            <div className="space-y-2">
              <Label>Porcentagens Disponíveis</Label>
              <div className="space-y-2">
                {paymentConditionFormData.porcentagens.map((porcentagem, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      value={porcentagem}
                      onChange={(e) => {
                        const novasPorcentagens = [...paymentConditionFormData.porcentagens];
                        novasPorcentagens[index] = parseInt(e.target.value) || 0;
                        setPaymentConditionFormData(prev => ({ ...prev, porcentagens: novasPorcentagens }));
                      }}
                      placeholder="Porcentagem"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    {paymentConditionFormData.porcentagens.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const novasPorcentagens = paymentConditionFormData.porcentagens.filter((_, i) => i !== index);
                          setPaymentConditionFormData(prev => ({ ...prev, porcentagens: novasPorcentagens }));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPaymentConditionFormData(prev => ({
                      ...prev,
                      porcentagens: [...prev.porcentagens, 0]
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Porcentagem
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={paymentConditionFormData.status} onValueChange={(value: "ATIVO" | "INATIVO") => setPaymentConditionFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSavePaymentCondition}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}