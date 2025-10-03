"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, Search, Filter, Loader2, Building2, Grid3X3, AlertTriangle, Activity, DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { useLotsData } from "@/hooks/use-lots-data";
import { useToast } from "@/hooks/use-toast";
import { NotificationService, NotificationTemplates } from "@/lib/notifications";

interface Lot {
  id: string;
  empreendimento: string;
  quadra: string;
  lote: string;
  area: number;
  valor: number;
  entrada: number;
  porcentagem?: number;
  valorPorMetro?: number; // Adicionando campo para valor por metro quadrado
  status: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  reservedAt?: string;
  reservedBy?: string;
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

export default function LotsPage() {
  const {
    lots,
    isLoading,
    error,
    addLot,
    updateLot,
    deleteLot,
    getReservationDaysLeft,
    checkExpiredReservations
  } = useLotsData();

  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmpreendimentoDialogOpen, setIsEmpreendimentoDialogOpen] = useState(false);
  const [isQuadraDialogOpen, setIsQuadraDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [lotToDelete, setLotToDelete] = useState<Lot | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [empreendimentoFilter, setEmpreendimentoFilter] = useState("all");
  const [quadraFilter, setQuadraFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    empreendimento: "",
    quadra: "",
    lote: "",
    area: "",
    valorPorMetro: "",
    porcentagemSelecionada: "",
    valor: "",
    entrada: "",
    quantidadeParcelas: "",
    valorSessentaPorcento: "",
    status: "DISPONÍVEL",
    observacoes: ""
  });

  // State to track existing lots for the selected empreendimento and quadra
  const [existingLotsForSelection, setExistingLotsForSelection] = useState<Lot[]>([]);

  const [empreendimentoFormData, setEmpreendimentoFormData] = useState({
    nome: "",
    descricao: "",
    endereco: "",
    cidade: "",
    estado: "",
    areaTotal: ""
  });

  const [quadraFormData, setQuadraFormData] = useState({
    nome: "",
    empreendimento: ""
  });

  const [isCreatingQuadra, setIsCreatingQuadra] = useState(false);

  const [empreendimentos, setEmpreendimentos] = useState<Array<{
    id: string;
    nome: string;
    descricao?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    areaTotal?: number;
  }>>([]);

  const [quadras, setQuadras] = useState<Array<{
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
  }>>([]);

  // Carregar condições de pagamento do banco de dados
  const [paymentConditions, setPaymentConditions] = useState<PaymentCondition[]>([]);

  // Carregar configurações do sistema do banco de dados
  const [systemSettings, setSystemSettings] = useState({
    company: "Vale Empreendimentos",
    description: "Sistema completo para gestão de lotes, clientes e transações em Vale Empreendimentos",
    externalReserveLink: "https://wa.me/5511999999999?text=Olá! Gostaria de reservar um lote.",
    entradaPercentage: 10 // Porcentagem padrão para cálculo de entrada
  });

  // Estado para armazenar informações dos usuários
  const [usersInfo, setUsersInfo] = useState<Record<string, { name: string; creci: string }>>({});

  // Carregar dados do banco de dados
  useEffect(() => {
    const loadData = async () => {
      try {
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

        // Carregar condições de pagamento
        const paymentConditionsResponse = await fetch('/api/payment-conditions');
        if (paymentConditionsResponse.ok) {
          const paymentConditionsData = await paymentConditionsResponse.json();
          setPaymentConditions(paymentConditionsData.filter((condition: any) => 
            !condition.deletedAt && condition.status === "ATIVO"
          ));
        }

        // Carregar configurações do sistema
        const systemSettingsResponse = await fetch('/api/system-settings');
        if (systemSettingsResponse.ok) {
          const systemSettingsData = await systemSettingsResponse.json();
          setSystemSettings(prev => ({
            ...prev,
            entradaPercentage: systemSettingsData.porcentagemPadrao || 10
          }));
        }

        // Carregar informações dos usuários
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const usersMap: Record<string, { name: string; creci: string }> = {};
          usersData.forEach((user: any) => {
            usersMap[user.id] = {
              name: user.name || user.identifier,
              creci: user.creci || 'N/A'
            };
          });
          setUsersInfo(usersMap);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, []);

  // Effect to update existing lots when empreendimento or quadra changes
  useEffect(() => {
    if (formData.empreendimento && formData.quadra) {
      const filteredLots = lots.filter(lot => 
        lot.empreendimento === formData.empreendimento && 
        lot.quadra === formData.quadra &&
        (!editingLot || lot.id !== editingLot.id) // Exclude the current lot being edited
      );
      setExistingLotsForSelection(filteredLots);
    } else {
      setExistingLotsForSelection([]);
    }
  }, [formData.empreendimento, formData.quadra, lots, editingLot]);

  // Otimização: useMemo para filtragem - evita recálculo a cada renderização
  const filteredLots = useMemo(() => {
    if (!searchTerm && statusFilter === "all" && empreendimentoFilter === "all" && quadraFilter === "all") return lots;
    
    return lots.filter(lot => {
      const matchesSearch = !searchTerm || 
        lot.quadra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.lote.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || lot.status === statusFilter;
      const matchesEmpreendimento = empreendimentoFilter === "all" || lot.empreendimento === empreendimentoFilter;
      const matchesQuadra = quadraFilter === "all" || lot.quadra === quadraFilter;
      return matchesSearch && matchesStatus && matchesEmpreendimento && matchesQuadra;
    });
  }, [lots, searchTerm, statusFilter, empreendimentoFilter, quadraFilter]);

  // Otimização: useCallback para formatação de moeda
  const formatCurrency = useCallback((value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }, []);

  // Função para obter o nome do empreendimento pelo ID
  const getEmpreendimentoNome = useCallback((empreendimentoId: string) => {
    const empreendimento = empreendimentos.find(emp => emp.id === empreendimentoId);
    return empreendimento ? empreendimento.nome : empreendimentoId;
  }, [empreendimentos]);

  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalLots = lots.length;
    const availableLots = lots.filter(lot => lot.status === 'DISPONÍVEL').length;
    const soldLots = lots.filter(lot => lot.status === 'VENDIDO').length;
    const reservedLots = lots.filter(lot => lot.status === 'RESERVADO').length;
    const inProposalLots = lots.filter(lot => lot.status === 'EM PROPOSTA').length;
    const totalValue = lots.reduce((sum, lot) => sum + lot.valor, 0);

    return {
      totalLots,
      availableLots,
      soldLots,
      reservedLots,
      inProposalLots,
      totalValue
    };
  }, [lots]);

  // Efeito para limpar a quadra quando o empreendimento muda
  useEffect(() => {
    if (formData.empreendimento) {
      setFormData(prev => ({
        ...prev,
        quadra: ""
      }));
    }
  }, [formData.empreendimento]);

  // Efeito para depurar o formData quando o diálogo é aberto
  useEffect(() => {
    if (isDialogOpen) {
      console.log('Diálogo aberto, formData atual:', formData);
      console.log('Empreendimentos disponíveis:', empreendimentos);
      console.log('Quadras disponíveis:', quadras);
      console.log('Quadras filtradas para o empreendimento:', quadras.filter(q => q.empreendimentoId === formData.empreendimento));
    }
  }, [isDialogOpen, formData, empreendimentos, quadras]);

  // Efeito para limpar o filtro de quadra quando o filtro de empreendimento muda
  useEffect(() => {
    if (empreendimentoFilter !== "all") {
      setQuadraFilter("all");
    }
  }, [empreendimentoFilter]);

  // Otimização: useCallback para funções de manipulação
  const getStatusBadgeWithTooltip = useCallback((lot: Lot) => {
    const badge = (status: string) => {
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
    };

    // Se o lote estiver reservado e tiver informações de quem reservou, mostrar tooltip
    if (lot.status === 'RESERVADO' && lot.reservedBy && lot.reservedAt) {
      const userInfo = usersInfo[lot.reservedBy];
      const reservedDate = new Date(lot.reservedAt);
      const formattedDate = reservedDate.toLocaleDateString('pt-BR');
      const formattedTime = reservedDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              {badge(lot.status)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Informações da Reserva</p>
              {userInfo && (
                <p className="text-sm">
                  <span className="font-medium">CRECI:</span> {userInfo.creci}
                </p>
              )}
              {userInfo && (
                <p className="text-sm">
                  <span className="font-medium">Corretor:</span> {userInfo.name}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Data:</span> {formattedDate}
              </p>
              <p className="text-sm">
                <span className="font-medium">Horário:</span> {formattedTime}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    // Para outros status, retornar apenas o badge
    return badge(lot.status);
  }, [usersInfo]);

  // Otimização: useCallback para handlers
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Check if the lote already exists for this empreendimento and quadra
    const existingLotConflict = existingLotsForSelection.some(lot => 
      lot.lote === formData.lote && 
      lot.empreendimento === formData.empreendimento && 
      lot.quadra === formData.quadra
    );
    
    if (existingLotConflict) {
      await NotificationService.error(
        "Conflito de Lote",
        `Já existe um lote ${formData.quadra}-${formData.lote} neste empreendimento. Por favor, escolha um número diferente.`
      );
      setIsSubmitting(false);
      return;
    }

    const newLot: Lot = {
      id: editingLot?.id || Date.now().toString(),
      empreendimento: formData.empreendimento,
      quadra: formData.quadra.toUpperCase(),
      lote: formData.lote.padStart(2, '0'),
      area: parseFloat(formData.area.replace(',', '.')),
      valor: parseFloat(formData.valor.replace(',', '.')),
      entrada: parseFloat(formData.entrada.replace(',', '.')) || (parseFloat(formData.valor.replace(',', '.')) * 0.1), // 10% do valor se não especificado
      porcentagem: formData.porcentagemSelecionada ? parseFloat(formData.porcentagemSelecionada.replace(',', '.')) : undefined,
      valorPorMetro: formData.valorPorMetro ? parseFloat(formData.valorPorMetro.replace(',', '.')) : undefined,
      status: formData.status,
      observacoes: formData.observacoes,
      createdAt: editingLot?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validação adicional
    if (!newLot.empreendimento || !newLot.quadra || !newLot.lote || !newLot.area || !newLot.valor) {
      console.error('Campos obrigatórios não preenchidos:', newLot);
      await NotificationService.error(
        "Campos obrigatórios",
        "Por favor, preencha todos os campos obrigatórios."
      );
      setIsSubmitting(false);
      return;
    }

    if (isNaN(newLot.area) || isNaN(newLot.valor) || isNaN(newLot.entrada)) {
      console.error('Valores numéricos inválidos:', { area: newLot.area, valor: newLot.valor, entrada: newLot.entrada });
      await NotificationService.error(
        "Valores inválidos",
        "Por favor, verifique se todos os valores numéricos estão corretos."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingLot) {
        await updateLot(editingLot.id, newLot);
        await NotificationService.success(
          "Lote atualizado com sucesso!",
          `O lote ${newLot.quadra}-${newLot.lote} foi atualizado.`
        );
      } else {
        await addLot(newLot);
        await NotificationService.success(
          "Lote criado com sucesso!",
          `O lote ${newLot.quadra}-${newLot.lote} foi criado.`
        );
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar lote:', error);
      await NotificationService.error(
        "Erro ao salvar lote",
        error instanceof Error ? error.message : "Ocorreu um erro ao salvar o lote. Por favor, tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingLot, addLot, updateLot, existingLotsForSelection]);

  const handleEdit = useCallback((lot: Lot) => {
    console.log('handleEdit chamado com lot:', lot);
    
    // Buscar o lote mais recente do estado 'lots' para garantir que temos os dados atualizados
    const currentLot = lots.find(l => l.id === lot.id);
    const lotToEdit = currentLot || lot;
    
    console.log('Lote atual encontrado no estado:', currentLot);
    console.log('Lote que será usado para edição:', lotToEdit);
    console.log('Quadras disponíveis:', quadras);
    console.log('Empreendimentos disponíveis:', empreendimentos);
    
    const valorTotal = lotToEdit.valor;
    const entrada = lotToEdit.entrada; // Usar o valor real salvo, não calcular automaticamente
    const valorSessentaPorcento = valorTotal * 0.6;
    
    setEditingLot(lotToEdit);
    
    // Encontrar o empreendimento correspondente para garantir que temos o ID correto
    const empreendimentoSelecionado = empreendimentos.find(emp => 
      emp.id === lotToEdit.empreendimento || emp.nome === lotToEdit.empreendimento
    );
    
    const empreendimentoId = empreendimentoSelecionado?.id || lotToEdit.empreendimento;
    
    // Verificar se a quadra do lote existe nas quadras cadastradas
    const quadraExistente = quadras.find(q => 
      q.nome === lotToEdit.quadra && q.empreendimentoId === empreendimentoId
    );
    console.log('Quadra existente encontrada:', quadraExistente);
    
    // Garantir que a quadra seja sempre o valor original do lote, sem modificações
    const quadraOriginal = lotToEdit.quadra || '';
    console.log('Quadra original do lote:', quadraOriginal);
    
    const formDataToSet = {
      empreendimento: empreendimentoId,
      quadra: quadraOriginal, // Usar sempre o valor original
      lote: lotToEdit.lote,
      area: lotToEdit.area.toString(),
      valorPorMetro: lotToEdit.valorPorMetro ? lotToEdit.valorPorMetro.toString() : "",
      porcentagemSelecionada: lotToEdit.porcentagem ? lotToEdit.porcentagem.toString() : "",
      valor: lotToEdit.valor.toString(),
      entrada: entrada.toString(),
      quantidadeParcelas: "",
      valorSessentaPorcento: valorSessentaPorcento.toFixed(2),
      status: lotToEdit.status,
      observacoes: lotToEdit.observacoes || ""
    };
    
    console.log('FormData que será setado:', formDataToSet);
    console.log('Empreendimento ID selecionado:', empreendimentoId);
    console.log('Quadra selecionada:', quadraOriginal);
    
    // Setar o formData imediatamente
    setFormData(formDataToSet);
    
    // Abrir o diálogo sem delay para garantir sincronização
    setIsDialogOpen(true);
  }, [lots, empreendimentos, quadras]);

  const handleDelete = useCallback((lot: Lot) => {
    setLotToDelete(lot);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (lotToDelete) {
      deleteLot(lotToDelete.id);
      await NotificationService.success(
        "Lote excluído com sucesso!",
        `O lote ${lotToDelete.quadra}-${lotToDelete.lote} foi excluído.`
      );
      if (selectedLot?.id === lotToDelete.id) {
        setSelectedLot(null);
      }
      setLotToDelete(null);
    }
  }, [lotToDelete, deleteLot, selectedLot]);

  const cancelDelete = useCallback(() => {
    setLotToDelete(null);
  }, []);

  const handleLotClick = useCallback((lot: Lot) => {
    setSelectedLot(selectedLot?.id === lot.id ? null : lot);
  }, [selectedLot]);

  const resetForm = useCallback(() => {
    setFormData({
      empreendimento: "",
      quadra: "",
      lote: "",
      area: "",
      valorPorMetro: "",
      porcentagemSelecionada: "",
      valor: "",
      entrada: "",
      quantidadeParcelas: "",
      valorSessentaPorcento: "",
      status: "DISPONÍVEL",
      observacoes: ""
    });
    setEditingLot(null);
  }, []);

  const handleEmpreendimentoSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/empreendimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...empreendimentoFormData,
          areaTotal: empreendimentoFormData.areaTotal ? parseFloat(empreendimentoFormData.areaTotal) : undefined,
        }),
      });

      if (response.ok) {
        const novoEmpreendimento = await response.json();
        setEmpreendimentos(prev => [...prev, novoEmpreendimento]);
        setIsEmpreendimentoDialogOpen(false);
        setEmpreendimentoFormData({
          nome: "",
          descricao: "",
          endereco: "",
          cidade: "",
          estado: "",
          areaTotal: ""
        });
        await NotificationService.success(
          "Empreendimento criado com sucesso!",
          `O empreendimento "${novoEmpreendimento.nome}" foi criado.`
        );
      } else {
        const error = await response.json();
        await NotificationService.error(
          "Erro ao criar empreendimento",
          `Ocorreu um erro: ${error.error}`
        );
      }
    } catch (error) {
      console.error('Erro ao criar empreendimento:', error);
      await NotificationService.error(
        "Erro ao criar empreendimento",
        "Ocorreu um erro ao criar o empreendimento. Tente novamente."
      );
    }
  }, [empreendimentoFormData]);

  const handleQuadraSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreatingQuadra(true);
    
    try {
      const response = await fetch('/api/quadras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: quadraFormData.nome,
          empreendimentoId: quadraFormData.empreendimento,
        }),
      });

      if (response.ok) {
        const novaQuadra = await response.json();
        setQuadras(prev => [...prev, novaQuadra]);
        setIsQuadraDialogOpen(false);
        setQuadraFormData({
          nome: "",
          empreendimento: ""
        });
        await NotificationService.success(
          "Quadra criada com sucesso!",
          `A quadra "${novaQuadra.nome}" foi criada.`
        );
      } else {
        const error = await response.json();
        await NotificationService.error(
          "Erro ao criar quadra",
          `Ocorreu um erro: ${error.error}`
        );
      }
    } catch (error) {
      console.error('Erro ao criar quadra:', error);
      await NotificationService.error(
        "Erro ao criar quadra",
        "Ocorreu um erro ao criar a quadra. Tente novamente."
      );
    } finally {
      setIsCreatingQuadra(false);
    }
  }, [quadraFormData]);

  // Função para calcular o valor automaticamente
  const handleValorPorMetroChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valorPorMetro = e.target.value;
    const area = parseFloat(formData.area.replace(',', '.'));
    const porcentagemSelecionada = formData.porcentagemSelecionada ? parseFloat(formData.porcentagemSelecionada.replace(',', '.')) : NaN;
    
    setFormData(prev => ({
      ...prev,
      valorPorMetro
    }));

    // Calcular valor total se área e valor por metro estiverem preenchidos
    if (!isNaN(area) && area > 0 && valorPorMetro) {
      const valorPorMetroNum = parseFloat(valorPorMetro.replace(',', '.'));
      if (!isNaN(valorPorMetroNum)) {
        const valorTotal = area * valorPorMetroNum;
        
        // Se houver porcentagem selecionada, aplicar o desconto
        if (!isNaN(porcentagemSelecionada) && porcentagemSelecionada > 0) {
          const valorComPorcentagem = valorTotal * (porcentagemSelecionada / 100);
          setFormData(prev => ({
            ...prev,
            valorPorMetro,
            valor: valorComPorcentagem.toFixed(2)
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            valorPorMetro,
            valor: valorTotal.toFixed(2)
          }));
        }
      }
    }
  }, [formData.area, formData.porcentagemSelecionada]);

  const handleAreaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const area = e.target.value;
    const valorPorMetro = formData.valorPorMetro ? parseFloat(formData.valorPorMetro.replace(',', '.')) : NaN;
    const porcentagemSelecionada = formData.porcentagemSelecionada ? parseFloat(formData.porcentagemSelecionada.replace(',', '.')) : NaN;
    
    setFormData(prev => ({
      ...prev,
      area
    }));

    // Calcular valor total se área e valor por metro estiverem preenchidos
    if (area && !isNaN(valorPorMetro) && valorPorMetro > 0) {
      const areaNum = parseFloat(area);
      if (!isNaN(areaNum)) {
        const valorTotal = areaNum * valorPorMetro;
        
        // Se houver porcentagem selecionada, aplicar o desconto
        if (!isNaN(porcentagemSelecionada) && porcentagemSelecionada > 0) {
          const valorComPorcentagem = valorTotal * (porcentagemSelecionada / 100);
          setFormData(prev => ({
            ...prev,
            area,
            valor: valorComPorcentagem.toFixed(2)
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            area,
            valor: valorTotal.toFixed(2)
          }));
        }
      }
    }
  }, [formData.valorPorMetro, formData.porcentagemSelecionada]);

  // Funções para formatação de moeda brasileira
  const formatCurrencyBR = useCallback((value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(numValue)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  }, []);

  const formatNumberBR = useCallback((value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    if (isNaN(numValue)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  }, []);

  const parseCurrencyBR = useCallback((formattedValue: string): number => {
    // Remove o símbolo R$, espaços e pontos de milhar, depois substitui vírgula por ponto
    const cleanValue = formattedValue
      .replace(/[R$\s.]/g, '')
      .replace(',', '.');
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Função para formatar o valor no input
  const formatValorInput = useCallback((value: string): string => {
    if (!value) return '';
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue)) return '';
    return formatNumberBR(numValue);
  }, [formatNumberBR]);

  // Atualizar as funções de cálculo automático para usar a formatação correta
  const updateValorTotal = useCallback((area: number, valorPorMetro: number) => {
    if (!isNaN(area) && area > 0 && !isNaN(valorPorMetro) && valorPorMetro > 0) {
      const valorTotal = area * valorPorMetro;
      setFormData(prev => ({
        ...prev,
        valor: valorTotal.toFixed(2)
      }));
    }
  }, []);

  // Helper function to calculate entrada based on value and system settings
  const calcularEntrada = useCallback((valor: number): number => {
    if (!valor || isNaN(valor) || valor <= 0) return 0;
    
    const porcentagemEntrada = systemSettings.entradaPercentage || 10;
    return valor * (porcentagemEntrada / 100);
  }, [systemSettings.entradaPercentage]);

  // Função para calcular 60% do valor automaticamente
  const handleValorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCurrencyBR(rawValue);
    
    // Atualiza o estado com o valor numérico
    setFormData(prev => ({
      ...prev,
      valor: numericValue.toFixed(2)
    }));

    // Calcular 60% do valor automaticamente
    if (!isNaN(numericValue) && numericValue > 0) {
      const sessentaPorcento = numericValue * 0.6;
      
      // Calcular entrada baseada na porcentagem de entrada das configurações
      const entrada = calcularEntrada(numericValue);
      
      setFormData(prev => ({
        ...prev,
        valor: numericValue.toFixed(2),
        valorSessentaPorcento: sessentaPorcento.toFixed(2),
        entrada: entrada.toFixed(2)
      }));
    }
  }, [parseCurrencyBR, calcularEntrada]);

  const handleEntradaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCurrencyBR(rawValue);
    
    setFormData(prev => ({
      ...prev,
      entrada: numericValue.toFixed(2)
    }));
  }, [parseCurrencyBR]);

  // Função para calcular valor baseado na porcentagem selecionada (apenas para valor total)
  const handlePorcentagemChange = useCallback((value: string) => {
    const porcentagem = parseFloat(value.replace(',', '.'));
    const area = parseFloat(formData.area.replace(',', '.'));
    const valorPorMetro = formData.valorPorMetro ? parseFloat(formData.valorPorMetro.replace(',', '.')) : NaN;
    
    setFormData(prev => ({
      ...prev,
      porcentagemSelecionada: value
    }));

    // Calcular valor total se área, valor por metro e porcentagem estiverem preenchidos
    if (!isNaN(area) && area > 0 && !isNaN(valorPorMetro) && valorPorMetro > 0 && !isNaN(porcentagem) && porcentagem > 0) {
      const valorTotal = area * valorPorMetro;
      const valorComPorcentagem = valorTotal * (porcentagem / 100);
      
      // Calcular entrada automaticamente baseada nas configurações
      const entrada = calcularEntrada(valorComPorcentagem);
      
      setFormData(prev => ({
        ...prev,
        porcentagemSelecionada: value,
        valor: valorComPorcentagem.toFixed(2),
        entrada: entrada.toFixed(2)
      }));
    }
  }, [formData.area, formData.valorPorMetro, calcularEntrada]);

  const handleQuantidadeParcelasChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = e.target.value;
    setFormData(prev => ({
      ...prev,
      quantidadeParcelas: quantidade
    }));
  }, []);

  const handleValorSessentaPorcentoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseCurrencyBR(rawValue);
    
    setFormData(prev => ({
      ...prev,
      valorSessentaPorcento: numericValue.toFixed(2)
    }));
  }, [parseCurrencyBR]);

  // useEffect to ensure entrada and valorSessentaPorcento are always synchronized
  useEffect(() => {
    // Não recalcular em modo de edição para preservar os valores salvos
    if (editingLot) return;
    
    const valor = parseFloat(formData.valor.replace(',', '.'));
    
    if (!isNaN(valor) && valor > 0) {
      const entrada = calcularEntrada(valor);
      const entradaAtual = parseFloat(formData.entrada.replace(',', '.'));
      const valorSessentaPorcento = valor * 0.6;
      const valorSessentaPorcentoAtual = parseFloat(formData.valorSessentaPorcento.replace(',', '.'));
      
      // Only update if the calculated values are different from the current ones
      // to avoid infinite loops and allow manual override if needed
      const updates: any = {};
      
      if (isNaN(entradaAtual) || Math.abs(entrada - entradaAtual) > 0.01) {
        updates.entrada = entrada.toFixed(2);
      }
      
      if (isNaN(valorSessentaPorcentoAtual) || Math.abs(valorSessentaPorcento - valorSessentaPorcentoAtual) > 0.01) {
        updates.valorSessentaPorcento = valorSessentaPorcento.toFixed(2);
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...updates
        }));
      }
    }
  }, [formData.valor, calcularEntrada, editingLot]);

  // useEffect para depurar o problema da quadra
  useEffect(() => {
    if (isDialogOpen && editingLot) {
      console.log('=== DEPURAÇÃO DIÁLOGO EDIÇÃO ===');
      console.log('EditingLot:', editingLot);
      console.log('FormData atual:', formData);
      console.log('Empreendimentos disponíveis:', empreendimentos);
      console.log('Quadras disponíveis:', quadras);
      console.log('Quadras filtradas para o empreendimento:', quadras.filter(q => q.empreendimentoId === formData.empreendimento));
      console.log('Quadra atual do formData:', formData.quadra);
      console.log('Empreendimento atual do formData:', formData.empreendimento);
      
      // Verificar se a quadra atual existe na lista filtrada
      const quadraNaListaFiltrada = quadras.some(q => 
        q.empreendimentoId === formData.empreendimento && q.nome === formData.quadra
      );
      console.log('Quadra existe na lista filtrada?', quadraNaListaFiltrada);
      
      // Verificar se a quadra existe em qualquer empreendimento
      const quadraExisteEmAlgumLugar = quadras.some(q => q.nome === formData.quadra);
      console.log('Quadra existe em algum lugar?', quadraExisteEmAlgumLugar);
      console.log('=== FIM DEPURAÇÃO ===');
    }
  }, [isDialogOpen, editingLot, formData, empreendimentos, quadras]);

  // useEffect para garantir que o formData.quadra esteja correto quando o diálogo é aberto
  useEffect(() => {
    if (isDialogOpen && editingLot && !formData.quadra) {
      console.log('Corrigindo formData.quadra vazio, definindo para:', editingLot.quadra);
      setFormData(prev => ({
        ...prev,
        quadra: editingLot.quadra || ''
      }));
    }
  }, [isDialogOpen, editingLot, formData.quadra]);

  return (
    <AuthGuard requireAdmin={true}>
      <TooltipProvider>
        <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Lotes</h1>
                <p className="text-muted-foreground">
                  Controle de lotes disponíveis para negociação
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isEmpreendimentoDialogOpen} onOpenChange={setIsEmpreendimentoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Building2 className="mr-2 h-4 w-4" />
                      Novo Empreendimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Empreendimento</DialogTitle>
                      <DialogDescription>
                        Preencha as informações para criar um novo empreendimento.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEmpreendimentoSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="nome" className="text-right">
                            Nome
                          </Label>
                          <Input
                            id="nome"
                            value={empreendimentoFormData.nome}
                            onChange={(e) => setEmpreendimentoFormData({...empreendimentoFormData, nome: e.target.value})}
                            className="col-span-3"
                            placeholder="Ex: Residencial Vale Verde"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="descricao" className="text-right">
                            Descrição
                          </Label>
                          <Textarea
                            id="descricao"
                            value={empreendimentoFormData.descricao}
                            onChange={(e) => setEmpreendimentoFormData({...empreendimentoFormData, descricao: e.target.value})}
                            className="col-span-3"
                            rows={2}
                            placeholder="Descrição do empreendimento"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="endereco" className="text-right">
                            Endereço
                          </Label>
                          <Input
                            id="endereco"
                            value={empreendimentoFormData.endereco}
                            onChange={(e) => setEmpreendimentoFormData({...empreendimentoFormData, endereco: e.target.value})}
                            className="col-span-3"
                            placeholder="Ex: Rua das Flores, 123"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="cidade" className="text-right">
                            Cidade
                          </Label>
                          <Input
                            id="cidade"
                            value={empreendimentoFormData.cidade}
                            onChange={(e) => setEmpreendimentoFormData({...empreendimentoFormData, cidade: e.target.value})}
                            className="col-span-3"
                            placeholder="Ex: São Paulo"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="estado" className="text-right">
                            Estado
                          </Label>
                          <Input
                            id="estado"
                            value={empreendimentoFormData.estado}
                            onChange={(e) => setEmpreendimentoFormData({...empreendimentoFormData, estado: e.target.value})}
                            className="col-span-3"
                            placeholder="Ex: SP"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="areaTotal" className="text-right">
                            Área Total (m²)
                          </Label>
                          <Input
                            id="areaTotal"
                            type="number"
                            value={empreendimentoFormData.areaTotal}
                            onChange={(e) => setEmpreendimentoFormData({...empreendimentoFormData, areaTotal: e.target.value})}
                            className="col-span-3"
                            placeholder="Ex: 50000"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">
                          Criar Empreendimento
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isQuadraDialogOpen} onOpenChange={setIsQuadraDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      Nova Quadra
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Quadra</DialogTitle>
                      <DialogDescription>
                        Preencha as informações para criar uma nova quadra.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleQuadraSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="quadraNome" className="text-right">
                            Quadra
                          </Label>
                          <Input
                            id="quadraNome"
                            value={quadraFormData.nome}
                            onChange={(e) => setQuadraFormData({...quadraFormData, nome: e.target.value})}
                            className="col-span-3"
                            placeholder="Ex: A"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="empreendimento" className="text-right">
                            Empreendimento
                          </Label>
                          <Select
                            value={quadraFormData.empreendimento}
                            onValueChange={(value) => setQuadraFormData({...quadraFormData, empreendimento: value})}
                            required
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Selecione um empreendimento" />
                            </SelectTrigger>
                            <SelectContent>
                              {empreendimentos.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Nenhum empreendimento cadastrado
                                </div>
                              ) : (
                                empreendimentos.map((empreendimento) => (
                                  <SelectItem key={empreendimento.id} value={empreendimento.id}>
                                    {empreendimento.nome}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isCreatingQuadra}>
                          {isCreatingQuadra ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Criando...
                            </>
                          ) : (
                            "Criar Quadra"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Lote
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLot ? "Editar Lote" : "Criar Novo Lote"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingLot 
                        ? "Edite as informações do lote existente."
                        : "Preencha as informações para criar um novo lote."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="empreendimento">
                            Empreendimento
                          </Label>
                          <Select
                            value={formData.empreendimento}
                            onValueChange={(value) => setFormData({...formData, empreendimento: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o empreendimento" />
                            </SelectTrigger>
                            <SelectContent>
                              {empreendimentos.map((empreendimento) => (
                                <SelectItem key={empreendimento.id} value={empreendimento.id}>
                                  {empreendimento.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quadra">
                            Quadra
                          </Label>
                          <Select
                            value={formData.quadra || ""}
                            onValueChange={(value) => setFormData({...formData, quadra: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a quadra" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Mostrar todas as quadras do empreendimento selecionado */}
                              {quadras
                                .filter(quadra => 
                                  !formData.empreendimento || 
                                  quadra.empreendimentoId === formData.empreendimento
                                )
                                .sort((a, b) => a.nome.localeCompare(b.nome))
                                .map((quadra) => (
                                  <SelectItem key={quadra.id} value={quadra.nome}>
                                    {quadra.nome}
                                  </SelectItem>
                                ))
                              }
                              {/* Fallback: Mostrar a quadra atual apenas se não estiver na lista filtrada */}
                              {formData.quadra && 
                                !quadras.some(quadra => 
                                  (!formData.empreendimento || quadra.empreendimentoId === formData.empreendimento) && 
                                  quadra.nome === formData.quadra
                                ) && (
                                <SelectItem key={`current-${formData.quadra}`} value={formData.quadra}>
                                  {formData.quadra} (Atual)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lote">
                            Lote
                          </Label>
                          <Input
                            id="lote"
                            value={formData.lote}
                            onChange={(e) => setFormData({...formData, lote: e.target.value})}
                            placeholder="Ex: 01"
                            required
                          />
                          {/* Show alert if the entered lote already exists */}
                          {formData.lote && existingLotsForSelection.some(lot => lot.lote === formData.lote) && (
                            <div className="mt-1">
                              <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Este número de lote já existe nesta quadra
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">
                            Status
                          </Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({...formData, status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DISPONÍVEL">Disponível</SelectItem>
                              <SelectItem value="RESERVADO">Reservado</SelectItem>
                              <SelectItem value="EM PROPOSTA">Em Proposta</SelectItem>
                              <SelectItem value="VENDIDO">Vendido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="area">
                            Área (m²)
                          </Label>
                          <Input
                            id="area"
                            type="number"
                            value={formData.area}
                            onChange={handleAreaChange}
                            placeholder="Ex: 450"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="valorPorMetro">
                            R$ (m²)
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="valorPorMetro"
                              type="number"
                              step="0.01"
                              value={formData.valorPorMetro}
                              onChange={handleValorPorMetroChange}
                              placeholder="Ex: 1500.00"
                              required
                              className="flex-1"
                            />
                            <Select
                              value={formData.porcentagemSelecionada}
                              onValueChange={handlePorcentagemChange}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Porcentagem" />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentConditions
                                  .filter(condition => condition.status === "ATIVO")
                                  .filter(condition => condition.nome === "Porcentagem para Valor Total")
                                  .map((condition) => (
                                    condition.porcentagens.map((porcentagem) => (
                                      <SelectItem key={`${condition.id}-${porcentagem}`} value={porcentagem.toString()}>
                                        {porcentagem}%
                                      </SelectItem>
                                    ))
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="valor">
                            Valor (R$)
                          </Label>
                          <Input
                            id="valor"
                            type="text"
                            value={formatValorInput(formData.valor)}
                            onChange={handleValorChange}
                            placeholder="0,00"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="entrada" className="flex items-center gap-2">
                            Entrada (R$)
                          </Label>
                          <Input
                            id="entrada"
                            type="text"
                            value={formatValorInput(formData.entrada)}
                            onChange={handleEntradaChange}
                            placeholder="0,00"
                            readOnly={!editingLot} // Permitir edição apenas quando está editando
                            className={!editingLot ? "bg-muted/50" : ""}
                          />
                          <p className="text-xs text-muted-foreground">
                            {editingLot 
                              ? "Pode editar manualmente" 
                              : `Calculado automaticamente: ${systemSettings.entradaPercentage}% do valor total`
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Função para calcular valores das condições de pagamento */}
                      {(() => {
                        const valorTotal = parseFloat(formData.valor.replace(',', '.')) || 0;
                        
                        const calcularValoresPagamento = (parcelas: number, anual: number) => {
                          if (!valorTotal || valorTotal <= 0) {
                            return {
                              sessentaPorcento: '0,00',
                              trintaPorcento: '0,00'
                            };
                          }
                          
                          const valorSessentaPorcento = (valorTotal * 0.60) / parcelas;
                          const valorTrintaPorcento = (valorTotal * 0.30) / anual;
                          
                          return {
                            sessentaPorcento: valorSessentaPorcento.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }),
                            trintaPorcento: valorTrintaPorcento.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })
                          };
                        };
                        
                        // Calcular valores para cada plano
                        const valores36x = calcularValoresPagamento(36, 3);
                        const valores48x = calcularValoresPagamento(48, 4);
                        const valores60x = calcularValoresPagamento(60, 5);
                        const valores96x = calcularValoresPagamento(96, 8);
                        const valores120x = calcularValoresPagamento(120, 10);
                        const valores123x = calcularValoresPagamento(123, 11);
                        
                        return (
                          <>
                            {/* Seção de Cards de Pagamento */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-center">Condições de Pagamento</h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                
                                {/* Card 36x */}
                                <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-center text-blue-600">36x</CardTitle>
                                    <CardDescription className="text-center">Pagamento em 36 parcelas</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Qt</Label>
                                        <Input type="number" value="36" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (60%)</Label>
                                        <Input type="text" value={valores36x.sessentaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Anual</Label>
                                        <Input type="text" value="3" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (30%)</Label>
                                        <Input type="text" value={valores36x.trintaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Card 48x */}
                                <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-center text-green-600">48x</CardTitle>
                                    <CardDescription className="text-center">Pagamento em 48 parcelas</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Qt</Label>
                                        <Input type="number" value="48" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (60%)</Label>
                                        <Input type="text" value={valores48x.sessentaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Anual</Label>
                                        <Input type="text" value="4" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (30%)</Label>
                                        <Input type="text" value={valores48x.trintaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Card 60x */}
                                <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-center text-purple-600">60x</CardTitle>
                                    <CardDescription className="text-center">Pagamento em 60 parcelas</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Qt</Label>
                                        <Input type="number" value="60" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (60%)</Label>
                                        <Input type="text" value={valores60x.sessentaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Anual</Label>
                                        <Input type="text" value="5" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (30%)</Label>
                                        <Input type="text" value={valores60x.trintaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Card 96x */}
                                <Card className="border-2 border-orange-200 hover:border-orange-400 transition-colors">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-center text-orange-600">96x</CardTitle>
                                    <CardDescription className="text-center">Pagamento em 96 parcelas</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Qt</Label>
                                        <Input type="number" value="96" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (60%)</Label>
                                        <Input type="text" value={valores96x.sessentaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Anual</Label>
                                        <Input type="text" value="8" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (30%)</Label>
                                        <Input type="text" value={valores96x.trintaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Card 120x */}
                                <Card className="border-2 border-red-200 hover:border-red-400 transition-colors">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-center text-red-600">120x</CardTitle>
                                    <CardDescription className="text-center">Pagamento em 120 parcelas</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Qt</Label>
                                        <Input type="number" value="120" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (60%)</Label>
                                        <Input type="text" value={valores120x.sessentaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Anual</Label>
                                        <Input type="text" value="10" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (30%)</Label>
                                        <Input type="text" value={valores120x.trintaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Card 123x */}
                                <Card className="border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-center text-indigo-600">123x</CardTitle>
                                    <CardDescription className="text-center">Pagamento em 123 parcelas</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Qt</Label>
                                        <Input type="number" value="123" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (60%)</Label>
                                        <Input type="text" value={valores123x.sessentaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <Label className="text-xs text-gray-600">Anual</Label>
                                        <Input type="text" value="11" className="h-8 text-xs" readOnly />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">R$ (30%)</Label>
                                        <Input type="text" value={valores123x.trintaPorcento} className="h-8 text-xs" readOnly />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                              </div>
                            </div>
                          </>
                        );
                      })()}
                      
                      {/* Linha separadora final */}
                      <div className="border-t border-gray-200 my-4"></div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="observacoes" className="text-right">
                          Observações
                        </Label>
                        <Textarea
                          id="observacoes"
                          value={formData.observacoes}
                          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                          className="col-span-3"
                          rows={3}
                          placeholder="Informações adicionais sobre o lote"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || existingLotsForSelection.some(lot => 
                          lot.lote === formData.lote && 
                          lot.empreendimento === formData.empreendimento && 
                          lot.quadra === formData.quadra
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Atualizando
                          </>
                        ) : editingLot ? (
                          "Atualizar Lote"
                        ) : (
                          "Criar Lote"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* AlertDialog de confirmação de exclusão */}
              <AlertDialog open={!!lotToDelete} onOpenChange={(open) => !open && cancelDelete()}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Confirmar Exclusão
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o lote <strong>{lotToDelete?.quadra} {lotToDelete?.lote}</strong>? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={cancelDelete}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                      Excluir Lote
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <span className="font-medium">Erro:</span>
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dashboard Cards */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.totalLots.toLocaleString('pt-BR')}</div>
                  <p className="text-xs text-muted-foreground">
                    Total de lotes cadastrados
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lotes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{dashboardStats.availableLots}</div>
                  <p className="text-xs text-muted-foreground">
                    Lotes disponíveis para negociação
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Proposta</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{dashboardStats.inProposalLots}</div>
                  <p className="text-xs text-muted-foreground">
                    Lotes em proposta
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendidos</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{dashboardStats.soldLots}</div>
                  <p className="text-xs text-muted-foreground">
                    Lotes já vendidos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    Valor total dos lotes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lots Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                      <CardTitle>Lotes Cadastrados</CardTitle>
                      <CardDescription>
                        Lista de todos os lotes disponíveis para negociação
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por quadra ou lote..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={empreendimentoFilter} onValueChange={setEmpreendimentoFilter}>
                        <SelectTrigger className="w-[180px]">
                          <Building2 className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Empreendimento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos Empreendimentos</SelectItem>
                          {empreendimentos.map((empreendimento) => (
                            <SelectItem key={empreendimento.id} value={empreendimento.id}>
                              {empreendimento.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={quadraFilter} onValueChange={setQuadraFilter}>
                        <SelectTrigger className="w-[140px]">
                          <Grid3X3 className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Quadra" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas Quadras</SelectItem>
                          {quadras
                            .filter(quadra => 
                              empreendimentoFilter === "all" || quadra.empreendimentoId === empreendimentoFilter
                            )
                            .sort((a, b) => a.nome.localeCompare(b.nome))
                            .map((quadra) => (
                              <SelectItem key={quadra.id} value={quadra.nome}>
                                {quadra.nome}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos Status</SelectItem>
                          <SelectItem value="DISPONÍVEL">Disponível</SelectItem>
                          <SelectItem value="RESERVADO">Reservado</SelectItem>
                          <SelectItem value="EM PROPOSTA">Em Proposta</SelectItem>
                          <SelectItem value="VENDIDO">Vendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="ml-2 text-muted-foreground">Carregando lotes...</span>
                </div>
              ) : (
                <>
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
                      {filteredLots.map((lot) => (
                        <TableRow 
                          key={lot.id}
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedLot?.id === lot.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleLotClick(lot)}
                        >
                          <TableCell className="font-medium">{getEmpreendimentoNome(lot.empreendimento)}</TableCell>
                          <TableCell className="font-medium">{lot.quadra}</TableCell>
                          <TableCell>{lot.lote}</TableCell>
                          <TableCell>{lot.area.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(lot.valor)}</TableCell>
                          <TableCell>
                            {(() => {
                              const daysLeft = getReservationDaysLeft ? getReservationDaysLeft(lot) : null;
                              
                              if (lot.status === 'RESERVADO' && daysLeft !== null) {
                                return (
                                  <div className="flex items-center gap-2">
                                    {getStatusBadgeWithTooltip(lot)}
                                    {daysLeft <= 2 ? (
                                      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                                        <AlertTriangle className="h-3 w-3" />
                                        {daysLeft}d
                                      </Badge>
                                    ) : daysLeft <= 5 ? (
                                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1 text-xs">
                                        <Clock className="h-3 w-3" />
                                        {daysLeft}d
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                        <Clock className="h-3 w-3" />
                                        {daysLeft}d
                                      </Badge>
                                    )}
                                  </div>
                                );
                              }
                              
                              return getStatusBadgeWithTooltip(lot);
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(lot)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar Lote</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(lot)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir Lote</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredLots.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum lote encontrado com os filtros selecionados.
                    </div>
                  )}
                </>
              )}
            </CardContent>
            </Card>

            {/* Lot Details Modal */}
            <Dialog open={!!selectedLot} onOpenChange={(open) => !open && setSelectedLot(null)}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    Detalhes do Lote {selectedLot?.quadra}-{selectedLot?.lote}
                    {selectedLot && getStatusBadgeWithTooltip(selectedLot)}
                  </DialogTitle>
                  <DialogDescription>
                    Informações detalhadas do lote selecionado
                  </DialogDescription>
                </DialogHeader>
                {selectedLot && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-muted-foreground">Informações Básicas</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Empreendimento</p>
                          <p className="font-medium">{getEmpreendimentoNome(selectedLot.empreendimento)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quadra</p>
                          <p className="font-medium">{selectedLot.quadra}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lote</p>
                          <p className="font-medium">{selectedLot.lote}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Área</p>
                          <p className="font-medium">{selectedLot.area.toLocaleString('pt-BR')} m²</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="font-medium">{formatCurrency(selectedLot.valor)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Entrada</p>
                          <p className="font-medium">{formatCurrency(selectedLot.entrada)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor por m²</p>
                          <p className="font-medium">{formatCurrency(selectedLot.valor / selectedLot.area)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Additional Info */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-muted-foreground">Informações Adicionais</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                          <p className="text-sm">{new Date(selectedLot.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Última Atualização</p>
                          <p className="text-sm">{new Date(selectedLot.updatedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                        {selectedLot.reservedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Data da Reserva</p>
                            <p className="text-sm">{new Date(selectedLot.reservedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          </div>
                        )}
                        {selectedLot.observacoes && (
                          <div>
                            <p className="text-sm text-muted-foreground">Observações</p>
                            <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedLot.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button 
                    onClick={() => selectedLot && handleEdit(selectedLot)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar Lote
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedLot(null)}
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </main>
      </div>
    </div>
    </TooltipProvider>
    </AuthGuard>
  );
}