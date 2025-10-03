"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart";
import { useAppToast } from "@/hooks/use-app-toast";

interface Empreendimento {
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
  deletedAt?: string;
  deletedBy?: string;
}

interface Lote {
  id: string;
  empreendimentoId?: string;
  quadraId?: string;
  empreendimento?: string;
  quadra?: string;
  lote: string;
  area: number;
  valor: number;
  entrada: number;
  status: string;
  observacoes?: string;
  createdAt: string;
}

export default function Dashboard() {
  const { showError } = useAppToast();
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [lots, setLots] = useState<Lote[]>([]);
  const [reservationsByMonth, setReservationsByMonth] = useState<{month: string, reservations: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar empreendimentos da API
        const empreendimentosResponse = await fetch('/api/empreendimentos');
        if (empreendimentosResponse.ok) {
          const empreendimentosData = await empreendimentosResponse.json();
          setEmpreendimentos(empreendimentosData);
        }

        // Buscar lotes da API
        const lotsResponse = await fetch('/api/lots');
        if (lotsResponse.ok) {
          const lotsResponseData = await lotsResponse.json();
          // A API retorna { data: [...], metadata: {...} }
          const lotsData = lotsResponseData.data || [];
          setLots(lotsData);
        }

        // Buscar reservas por mês da API
        const reservationsResponse = await fetch('/api/reports/reservations-by-month');
        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json();
          setReservationsByMonth(reservationsData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        showError("Erro ao carregar dados", "Ocorreu um erro ao carregar os dados do dashboard. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcular estatísticas com base nos dados reais
  const calculateStats = () => {
    const totalLotes = lots.length;
    const propostas = lots.filter(lot => lot.status === 'EM PROPOSTA').length;
    const vendas = lots.filter(lot => lot.status === 'VENDIDO').length;
    const receitaPrevista = lots.reduce((sum, lot) => sum + lot.valor, 0);

    return [
      {
        title: "Total de Lotes",
        value: totalLotes.toString(),
        description: "Total de lotes cadastrados"
      },
      {
        title: "Propostas",
        value: propostas.toString(),
        description: "Propostas recebidas"
      },
      {
        title: "Vendas",
        value: vendas.toString(),
        description: "Vendas realizadas"
      },
      {
        title: "Receita Prevista",
        value: `R$ ${receitaPrevista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        description: "Valor total previsto"
      }
    ];
  };

  const stats = calculateStats();

  // Obter lotes recentes (últimos 5)
  const recentLots = lots
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calcular distribuição de lotes por status
  const lotDistributionData = [
    { name: "Disponível", value: lots.filter(lot => lot.status === 'DISPONÍVEL').length, color: "#22c55e" },
    { name: "Reservado", value: lots.filter(lot => lot.status === 'RESERVADO').length, color: "#f59e0b" },
    { name: "Em Proposta", value: lots.filter(lot => lot.status === 'EM PROPOSTA').length, color: "#8b5cf6" },
    { name: "Vendido", value: lots.filter(lot => lot.status === 'VENDIDO').length, color: "#ef4444" }
  ].filter(item => item.value > 0);

  // Obter reservas por mês da API (dados reais)
  const reservationsData = reservationsByMonth.length > 0 ? reservationsByMonth : [];

  const chartConfig = {
    disponiveis: {
      label: "Disponível",
      color: "#22c55e",
    },
    reservados: {
      label: "Reservado",
      color: "#f59e0b",
    },
    emProposta: {
      label: "Em Proposta",
      color: "#8b5cf6",
    },
    vendidos: {
      label: "Vendido",
      color: "#ef4444",
    },
    reservas: {
      label: "Reservas",
      color: "#3b82f6",
    },
  };

  const getStatusBadge = (status: string) => {
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

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  // Função para obter nome do empreendimento pelo ID
  const getNomeEmpreendimento = (empreendimentoId?: string, empreendimento?: string) => {
    const idToUse = empreendimentoId || empreendimento;
    if (!idToUse) return "N/A";
    const empreendimentoObj = empreendimentos.find(emp => emp.id === idToUse);
    return empreendimentoObj ? empreendimentoObj.nome : "Empreendimento não encontrado";
  };

  if (loading) {
    return (
      <AuthGuard requireAdmin={true}>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAdmin={true}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Linha de Gráficos */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gráfico de Pizza - Distribuição de Lotes por Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Lotes por Status</CardTitle>
                  <CardDescription>Distribuição dos lotes por status no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={lotDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={0}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                      >
                        {lotDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const total = lotDistributionData.reduce((sum, item) => sum + item.value, 0);
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.value} lotes ({total > 0 ? ((data.value / total) * 100).toFixed(1) : 0}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ChartLegend />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Barras - Reservas por Mês */}
              <Card>
                <CardHeader>
                  <CardTitle>Reservas por Mês</CardTitle>
                  <CardDescription>Número de reservas efetuadas em cada mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={reservationsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Reservas', angle: -90, position: 'insideLeft' }}
                        domain={[0, 'dataMax + 5']}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-lg">
                                <p className="font-medium">{data.month}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.reservations} reservas
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="reservations" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        label={{ position: 'top', fill: '#374151', fontSize: 12 }}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Lotes Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Lotes Recentes</CardTitle>
                <CardDescription>Últimos lotes cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Quadra</TableHead>
                      <TableHead>Lt</TableHead>
                      <TableHead>Área (m²)</TableHead>
                      <TableHead>Valor (R$)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLots.map((lot, index) => (
                      <TableRow key={lot.id}>
                        <TableCell className="font-medium">{getNomeEmpreendimento(lot.empreendimentoId, lot.empreendimento)}</TableCell>
                        <TableCell>{lot.quadra || '-'}</TableCell>
                        <TableCell>{lot.lote}</TableCell>
                        <TableCell>{lot.area.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(lot.valor)}</TableCell>
                        <TableCell>{getStatusBadge(lot.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}