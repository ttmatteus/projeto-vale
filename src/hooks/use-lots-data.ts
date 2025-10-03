import { useState, useEffect, useMemo } from 'react';

interface Lot {
  id: string;
  empreendimento: string;
  quadra: string;
  lote: string;
  area: number;
  valor: number;
  entrada: number;
  porcentagem?: number;
  valorPorMetro?: number;
  status: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  reservedAt?: string; // Data quando o lote foi reservado
  reservedBy?: string; // ID do usuário que reservou o lote
}

export function useLotsData() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar lotes da API
  const fetchLots = useMemo(() => async () => {
    try {
      console.log('fetchLots chamado - carregando lotes...');
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/lots');
      if (!response.ok) {
        throw new Error('Erro ao carregar lotes');
      }
      
      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      
      // Transformar os dados da API para o formato esperado
      const formattedLots: Lot[] = data.data.map((lot: any) => ({
        id: lot.id || Math.random().toString(36).substr(2, 9),
        empreendimento: lot.empreendimento,
        quadra: lot.quadra,
        lote: lot.lote,
        area: lot.area || 0,
        valor: lot.valor || 0,
        entrada: lot.entrada || 0,
        porcentagem: lot.porcentagem,
        valorPorMetro: lot.valorPorMetro,
        status: lot.status,
        observacoes: lot.observacoes,
        createdAt: lot.createdAt || new Date().toISOString(),
        updatedAt: lot.updatedAt || new Date().toISOString(),
        reservedAt: lot.reservedAt,
        reservedBy: lot.reservedBy
      }));
      
      console.log('FormattedLots:', formattedLots);
      setLots(formattedLots);
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao carregar os lotes');
      console.error('Erro ao carregar lotes:', err);
      setIsLoading(false);
    }
  }, []);

  // Função para verificar e atualizar lotes reservados expirados
  const checkExpiredReservations = useMemo(() => () => {
    const now = new Date();
    const updatedLots = lots.map(lot => {
      if (lot.status === 'RESERVADO' && lot.reservedAt) {
        const reservedDate = new Date(lot.reservedAt);
        const expirationDate = new Date(reservedDate.getTime() + (10 * 24 * 60 * 60 * 1000)); // 10 dias
        
        if (now > expirationDate) {
          // Se passou 10 dias e ainda está RESERVADO, voltar para DISPONÍVEL
          return {
            ...lot,
            status: 'DISPONÍVEL',
            reservedAt: undefined,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return lot;
    });
    
    setLots(updatedLots);
    return updatedLots;
  }, [lots]);

  // Função para calcular dias restantes de reserva
  const getReservationDaysLeft = useMemo(() => (lot: Lot) => {
    if (lot.status !== 'RESERVADO' || !lot.reservedAt) {
      return null;
    }
    
    const reservedDate = new Date(lot.reservedAt);
    const expirationDate = new Date(reservedDate.getTime() + (10 * 24 * 60 * 60 * 1000)); // 10 dias
    const now = new Date();
    
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, []);

  // Carregar lotes quando o componente montar
  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  // Verificar reservas expiradas a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      checkExpiredReservations();
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [checkExpiredReservations]);

  // Otimização: funções de manipulação memoizadas
  const addLot = useMemo(() => async (newLot: Lot) => {
    try {
      const response = await fetch('/api/lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLot),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar lote');
      }

      await fetchLots(); // Recarregar lotes após criar
    } catch (error) {
      console.error('Erro ao criar lote:', error);
      throw error;
    }
  }, [fetchLots]);

  const updateLot = useMemo(() => async (id: string, updatedLot: Partial<Lot>) => {
    try {
      console.log('updateLot chamado com id:', id, 'e updatedLot:', updatedLot);
      const response = await fetch('/api/lots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updatedLot }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar lote');
      }

      console.log('Lote atualizado com sucesso, recarregando lotes...');
      await fetchLots(); // Recarregar lotes após atualizar
    } catch (error) {
      console.error('Erro ao atualizar lote:', error);
      throw error;
    }
  }, [fetchLots]);

  const deleteLot = useMemo(() => async (id: string) => {
    try {
      const response = await fetch(`/api/lots?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir lote');
      }

      await fetchLots(); // Recarregar lotes após excluir
    } catch (error) {
      console.error('Erro ao excluir lote:', error);
      throw error;
    }
  }, [fetchLots]);

  // Otimização: estatísticas calculadas
  const stats = useMemo(() => {
    const total = lots.length;
    const available = lots.filter(lot => lot.status === 'DISPONÍVEL').length;
    const reserved = lots.filter(lot => lot.status === 'RESERVADO').length;
    const sold = lots.filter(lot => lot.status === 'VENDIDO').length;
    const inProposal = lots.filter(lot => lot.status === 'EM PROPOSTA').length;
    const totalValue = lots.reduce((sum, lot) => sum + lot.valor, 0);

    return { total, available, reserved, sold, inProposal, totalValue };
  }, [lots]);

  return {
    lots,
    isLoading,
    error,
    addLot,
    updateLot,
    deleteLot,
    stats,
    getReservationDaysLeft,
    checkExpiredReservations
  };
}