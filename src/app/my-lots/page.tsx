"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserHeader } from "@/components/user-header";
import { AuthGuard } from "@/components/auth-guard";
import { useLotsData } from "@/hooks/use-lots-data";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Eye,
  Reserve
} from "lucide-react";

interface Lot {
  id: string;
  empreendimento: string;
  quadra: string;
  lote: string;
  area: number;
  valor: number;
  entrada: number;
  status: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  reservedAt?: string;
  reservedBy?: string;
}

export default function MyLotsPage() {
  const { lots, isLoading, updateLot, getReservationDaysLeft } = useLotsData();
  const { user, isAuthenticated } = useAuth();
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [lotToReserve, setLotToReserve] = useState<Lot | null>(null);
  const [lotToPropose, setLotToPropose] = useState<Lot | null>(null);
  const [reserveForm, setReserveForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    observacoes: ""
  });

  const [proposalForm, setProposalForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    valorProposta: "",
    observacoes: ""
  });

  // Estado para filtro de empreendimento
  const [empreendimentoFilter, setEmpreendimentoFilter] = useState<string>("todos");
  
  // Estado para armazenar empreendimentos
  const [empreendimentos, setEmpreendimentos] = useState<Array<{
    id: string;
    nome: string;
    descricao?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    areaTotal?: number;
  }>>([]);

  // Obter ID do usuário atual logado
  const currentUserId = user?.id || "user1";

  // Carregar empreendimentos do banco de dados
  useEffect(() => {
    const loadEmpreendimentos = async () => {
      try {
        const response = await fetch('/api/empreendimentos');
        if (response.ok) {
          const data = await response.json();
          setEmpreendimentos(data);
        }
      } catch (error) {
        console.error('Erro ao carregar empreendimentos:', error);
      }
    };

    loadEmpreendimentos();
  }, []);

  // Filtrar lotes com base nas regras de permissão:
  // - Lotes Disponíveis: Todos os lotes com status "DISPONÍVEL" (todos usuários podem ver)
  // - Lotes em Proposta: Apenas lotes com status "EM PROPOSTA" do usuário atual
  // - Lotes Reservados: Apenas lotes com status "RESERVADO" do usuário atual
  const { availableLots, userReservedLots, userProposedLots } = useMemo(() => {
    // Todos os lotes disponíveis podem ser visualizados por qualquer usuário
    const available = lots.filter(lot => lot.status === 'DISPONÍVEL');
    
    // Apenas lotes reservados pelo usuário atual
    const reserved = lots.filter(lot => 
      lot.status === 'RESERVADO' && 
      lot.reservedBy === currentUserId
    );
    
    // Apenas lotes em proposta pelo usuário atual
    const proposed = lots.filter(lot => 
      lot.status === 'EM PROPOSTA' && 
      lot.reservedBy === currentUserId
    );
    
    return { 
      availableLots: available, 
      userReservedLots: reserved, 
      userProposedLots: proposed 
    };
  }, [lots, currentUserId]);

  // Filtrar lotes disponíveis por empreendimento
  const filteredAvailableLots = useMemo(() => {
    if (empreendimentoFilter === "todos") {
      return availableLots;
    }
    return availableLots.filter(lot => lot.empreendimento === empreendimentoFilter);
  }, [availableLots, empreendimentoFilter]);

  // Função para formatar moeda
  const formatCurrency = useCallback((value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }, []);

  // Função para formatar data
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  // Função para obter nome do empreendimento pelo ID
  const getEmpreendimentoNome = useCallback((empreendimentoId: string) => {
    const empreendimento = empreendimentos.find(emp => emp.id === empreendimentoId);
    return empreendimento?.nome || empreendimentoId || "Desconhecido";
  }, [empreendimentos]);

  // Função para obter empreendimentos únicos disponíveis
  const getUniqueEmpreendimentos = useCallback(() => {
    const uniqueIds = [...new Set(availableLots.map(lot => lot.empreendimento))];
    return uniqueIds.map(id => {
      const emp = empreendimentos.find(e => e.id === id);
      return emp || { id, nome: `Empreendimento ${id}` };
    });
  }, [availableLots, empreendimentos]);

  // Função para obter badge de status
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "DISPONÍVEL":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Disponível</Badge>;
      case "RESERVADO":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Reservado</Badge>;
      case "EM PROPOSTA":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Em Proposta</Badge>;
      case "VENDIDO":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Vendido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  // Estado para armazenar configurações do sistema
  const [systemSettings, setSystemSettings] = useState({
    externalReserveLink: "https://wa.me/5511999999999?text=Olá! Gostaria de reservar um lote."
  });

  // Carregar configurações do sistema
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const response = await fetch('/api/system-settings');
        if (response.ok) {
          const settings = await response.json();
          setSystemSettings({
            externalReserveLink: settings.externalReserveLink || "https://wa.me/5511999999999?text=Olá! Gostaria de reservar um lote."
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do sistema:', error);
      }
    };

    loadSystemSettings();
  }, []);

  // Função para reservar um lote (abre link externo)
  const handleExternalReserve = useCallback((lot: Lot) => {
    // Obter o link configurado nas configurações do sistema
    let externalLink = systemSettings.externalReserveLink;
    
    // Se o link contiver placeholders, substitui pelas informações do lote
    const finalLink = externalLink
      .replace('{quadra}', lot.quadra)
      .replace('{lote}', lot.lote)
      .replace('{empreendimento}', getEmpreendimentoNome(lot.empreendimento))
      .replace('{area}', lot.area.toString())
      .replace('{valor}', lot.valor.toLocaleString('pt-BR'));
    
    window.open(finalLink, '_blank');
  }, [systemSettings.externalReserveLink, getEmpreendimentoNome]);

  // Função para fazer proposta de um lote
  const handleProposeLot = useCallback((lot: Lot) => {
    setLotToPropose(lot);
    setIsProposalDialogOpen(true);
  }, []);

  // Função para reservar um lote
  const handleReserveLot = useCallback((lot: Lot) => {
    setLotToReserve(lot);
    setIsReserveDialogOpen(true);
  }, []);

  // Função para confirmar reserva
  const confirmReserve = useCallback(() => {
    if (lotToReserve) {
      updateLot(lotToReserve.id, {
        status: 'RESERVADO',
        reservedBy: currentUserId
      });
      setIsReserveDialogOpen(false);
      setLotToReserve(null);
      setReserveForm({
        nome: "",
        email: "",
        telefone: "",
        observacoes: ""
      });
    }
  }, [lotToReserve, updateLot, currentUserId]);

  // Função para confirmar proposta
  const confirmProposal = useCallback(() => {
    if (lotToPropose) {
      updateLot(lotToPropose.id, {
        status: 'EM PROPOSTA',
        reservedBy: currentUserId
      });
      setIsProposalDialogOpen(false);
      setLotToPropose(null);
      setProposalForm({
        nome: "",
        email: "",
        telefone: "",
        valorProposta: "",
        observacoes: ""
      });
    }
  }, [lotToPropose, updateLot, currentUserId]);

  // Função para cancelar reserva
  const handleCancelReserve = useCallback((lot: Lot) => {
    updateLot(lot.id, {
      status: 'DISPONÍVEL'
    });
  }, [updateLot]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalAvailable = availableLots.length;
    const totalReserved = userReservedLots.length;
    const totalProposed = userProposedLots.length;
    
    return { totalAvailable, totalReserved, totalProposed };
  }, [availableLots, userReservedLots, userProposedLots]);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <div className="flex-1 flex flex-col overflow-hidden">
            <UserHeader />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando seus lotes...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col overflow-hidden">
          <UserHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
  

            {/* Header */}
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Meus Lotes</h1>
                <p className="text-muted-foreground">
                  Gerencie os lotes disponíveis e visualize suas reservas
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lotes Disponíveis</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAvailable}</div>
                  <p className="text-xs text-muted-foreground">Lotes disponíveis para reserva</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lotes Reservados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReserved}</div>
                  <p className="text-xs text-muted-foreground">Lotes reservados por você</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Proposta</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProposed}</div>
                  <p className="text-xs text-muted-foreground">Lotes em proposta por você</p>
                </CardContent>
              </Card>
            </div>

            {/* Lotes Disponíveis */}
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Home className="h-5 w-5" />
                          Lotes Disponíveis
                        </CardTitle>
                        <CardDescription>
                          Todos os lotes disponíveis para reserva no sistema.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 sm:ml-auto">
                        <Label htmlFor="empreendimento-filter" className="text-sm font-medium whitespace-nowrap">
                          Empreendimento:
                        </Label>
                        <Select value={empreendimentoFilter} onValueChange={setEmpreendimentoFilter}>
                          <SelectTrigger id="empreendimento-filter" className="w-48">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            {getUniqueEmpreendimentos().map((empreendimento) => (
                              <SelectItem key={empreendimento.id} value={empreendimento.id}>
                                {empreendimento.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAvailableLots.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {empreendimentoFilter === "todos" ? "Nenhum lote disponível" : "Nenhum lote encontrado para este empreendimento"}
                    </h3>
                    <p className="text-muted-foreground">
                      {empreendimentoFilter === "todos" 
                        ? "No momento, não há lotes disponíveis para reserva."
                        : "Não há lotes disponíveis para o empreendimento selecionado."
                      }
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empreendimento</TableHead>
                        <TableHead>Quadra</TableHead>
                        <TableHead>Lt</TableHead>
                        <TableHead>Área (m²)</TableHead>
                        <TableHead>Valor (R$)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAvailableLots.map((lot) => (
                        <TableRow 
                          key={lot.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {getEmpreendimentoNome(lot.empreendimento)}
                          </TableCell>
                          <TableCell className="font-medium">{lot.quadra}</TableCell>
                          <TableCell>{lot.lote}</TableCell>
                          <TableCell>{lot.area.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(lot.valor)}</TableCell>
                          <TableCell>
                            {getStatusBadge(lot.status)}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleExternalReserve(lot)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Reservar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Meus Lotes em Proposta */}
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Lotes em Proposta
                      </CardTitle>
                      <CardDescription>
                        Lotes que você fez proposta e está aguardando aprovação.
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {userProposedLots.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma proposta em andamento</h3>
                    <p className="text-muted-foreground">
                      Você não possui lotes com propostas em análise no momento.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quadra</TableHead>
                        <TableHead>Lt</TableHead>
                        <TableHead>Área (m²)</TableHead>
                        <TableHead>Valor (R$)</TableHead>
                        <TableHead>Entrada (R$)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userProposedLots.map((lot) => (
                        <TableRow 
                          key={lot.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-medium">{lot.quadra}</TableCell>
                          <TableCell>{lot.lote}</TableCell>
                          <TableCell>{lot.area.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(lot.valor)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(lot.entrada)}</TableCell>
                          <TableCell>
                            {getStatusBadge(lot.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() => handleCancelReserve(lot)}
                                variant="outline"
                                size="sm"
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Meus Lotes Reservados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Lotes Reservados
                </CardTitle>
                <CardDescription>
                  Lotes que você reservou. Apenas suas reservas são exibidas aqui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userReservedLots.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma reserva ativa</h3>
                    <p className="text-muted-foreground">
                      Você não possui lotes reservados no momento.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quadra</TableHead>
                        <TableHead>Lt</TableHead>
                        <TableHead>Área (m²)</TableHead>
                        <TableHead>Valor (R$)</TableHead>
                        <TableHead>Entrada (R$)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userReservedLots.map((lot) => {
                        const daysLeft = getReservationDaysLeft(lot);
                        return (
                          <TableRow 
                            key={lot.id}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-medium">{lot.quadra}</TableCell>
                            <TableCell>{lot.lote}</TableCell>
                            <TableCell>{lot.area.toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(lot.valor)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(lot.entrada)}</TableCell>
                            <TableCell>
                              {getStatusBadge(lot.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  onClick={() => handleCancelReserve(lot)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialog de Reserva */}
      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reservar Lote</DialogTitle>
            <DialogDescription>
              Preencha seus dados para reservar o lote {lotToReserve?.quadra}-{lotToReserve?.lote}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={reserveForm.nome}
                onChange={(e) => setReserveForm(prev => ({ ...prev, nome: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={reserveForm.email}
                onChange={(e) => setReserveForm(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={reserveForm.telefone}
                onChange={(e) => setReserveForm(prev => ({ ...prev, telefone: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observacoes" className="text-right">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={reserveForm.observacoes}
                onChange={(e) => setReserveForm(prev => ({ ...prev, observacoes: e.target.value }))}
                className="col-span-3"
                placeholder="Informações adicionais sobre a reserva..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmReserve}>
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Proposta */}
      <Dialog open={isProposalDialogOpen} onOpenChange={setIsProposalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fazer Proposta</DialogTitle>
            <DialogDescription>
              Preencha seus dados para fazer uma proposta para o lote {lotToPropose?.quadra}-{lotToPropose?.lote}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome-proposta" className="text-right">
                Nome
              </Label>
              <Input
                id="nome-proposta"
                value={proposalForm.nome}
                onChange={(e) => setProposalForm(prev => ({ ...prev, nome: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email-proposta" className="text-right">
                Email
              </Label>
              <Input
                id="email-proposta"
                type="email"
                value={proposalForm.email}
                onChange={(e) => setProposalForm(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone-proposta" className="text-right">
                Telefone
              </Label>
              <Input
                id="telefone-proposta"
                value={proposalForm.telefone}
                onChange={(e) => setProposalForm(prev => ({ ...prev, telefone: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="valor-proposta" className="text-right">
                Valor Proposta
              </Label>
              <Input
                id="valor-proposta"
                placeholder="0,00"
                value={proposalForm.valorProposta}
                onChange={(e) => setProposalForm(prev => ({ ...prev, valorProposta: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observacoes-proposta" className="text-right">
                Observações
              </Label>
              <Textarea
                id="observacoes-proposta"
                value={proposalForm.observacoes}
                onChange={(e) => setProposalForm(prev => ({ ...prev, observacoes: e.target.value }))}
                className="col-span-3"
                placeholder="Informações adicionais sobre a proposta..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProposalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmProposal}>
              Enviar Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </AuthGuard>
  );
}