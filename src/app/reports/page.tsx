"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  Calendar as CalendarIcon, 
  BarChart3,
  RefreshCw
} from "lucide-react";
import { format, subDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { AuthGuard } from "@/components/auth-guard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Lot {
  id: string;
  quantity: number;
  purchasePrice: number;
  status: string;
  paymentCondition: string;
  createdAt: string;
}

interface ReportData {
  totalLots: number;
  totalValue: number;
  availableLots: number;
  soldLots: number;
  reservedLots: number;
  paymentConditions: Array<{
    condition: string;
    lots: number;
    value: number;
  }>;
  monthlyData: Array<{
    month: string;
    lots: number;
    value: number;
  }>;
}

export default function ReportsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [reportType, setReportType] = useState("reserved");
  const [exportFormat, setExportFormat] = useState("pdf");

  // dados mockados para demonstração
  useEffect(() => {
    
    const mockLots: Lot[] = [];
    const paymentConditions = ["À Vista", "30 Dias", "60 Dias", "90 Dias", "Parcelado"];
    const statuses = ["AVAILABLE", "SOLD", "RESERVED", "PARTIAL"];
    
    for (let i = 0; i < 200; i++) {
      const date = subDays(new Date(), Math.floor(Math.random() * 90));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentCondition = paymentConditions[Math.floor(Math.random() * paymentConditions.length)];
      const quantity = Math.floor(Math.random() * 5000) + 100;
      const price = 50 + Math.random() * 100; // Price between 50 and 150
      
      mockLots.push({
        id: (i + 1).toString(),
        quantity,
        purchasePrice: price,
        status,
        paymentCondition,
        createdAt: date.toISOString()
      });
    }

    setLots(mockLots);
    generateReport(mockLots);
  }, []);

  const generateReport = (lotsData: Lot[]) => {
    const filteredLots = lotsData.filter(lot => 
      isWithinInterval(new Date(lot.createdAt), { start: dateRange.from, end: dateRange.to })
    );

    const totalLots = filteredLots.length;
    const totalValue = filteredLots.reduce((sum, lot) => sum + (lot.quantity * lot.purchasePrice), 0);
    const availableLots = filteredLots.filter(lot => lot.status === "AVAILABLE").length;
    const soldLots = filteredLots.filter(lot => lot.status === "SOLD").length;
    const reservedLots = filteredLots.filter(lot => lot.status === "RESERVED").length;

    
    const paymentStats = filteredLots.reduce((acc, lot) => {
      if (!acc[lot.paymentCondition]) {
        acc[lot.paymentCondition] = { condition: lot.paymentCondition, lots: 0, value: 0 };
      }
      acc[lot.paymentCondition].lots += 1;
      acc[lot.paymentCondition].value += lot.quantity * lot.purchasePrice;
      return acc;
    }, {} as Record<string, { condition: string; lots: number; value: number }>);

    const paymentConditions = Object.values(paymentStats);

 
    const monthlyStats = filteredLots.reduce((acc, lot) => {
      const month = format(new Date(lot.createdAt), "yyyy-MM");
      if (!acc[month]) {
        acc[month] = { month, lots: 0, value: 0 };
      }
      acc[month].lots += 1;
      acc[month].value += lot.quantity * lot.purchasePrice;
      return acc;
    }, {} as Record<string, { month: string; lots: number; value: number }>);

    const monthlyData = Object.values(monthlyStats)
      .sort((a, b) => a.month.localeCompare(b.month));

    setReportData({
      totalLots,
      totalValue,
      availableLots,
      soldLots,
      reservedLots,
      paymentConditions,
      monthlyData
    });
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    generateReport(lots);
    setIsGenerating(false);
  };

  const handleExport = () => {
    // Simulate export functionality
    const data = {
      reportType,
      dateRange,
      data: reportData,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
                <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
                <p className="text-muted-foreground">
                  Gere e exporte relatórios detalhados dos lotes e condições de pagamento
                </p>
              </div>
            </div>

            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Relatório</CardTitle>
                <CardDescription>
                  Selecione o período e tipo de relatório desejado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Tipo de Relatório</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reserved">Lotes Reservados</SelectItem>
                        <SelectItem value="sold">Lotes Vendidos</SelectItem>
                        <SelectItem value="available">Lotes Disponíveis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            <span>Selecione o período</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => {
                            if (range?.from && range?.to) {
                              setDateRange({ from: range.from, to: range.to });
                            }
                          }}
                          numberOfMonths={2}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Formato de Exportação</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="xlsx">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label> </Label>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleGenerateReport} 
                        disabled={isGenerating}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <BarChart3 className="mr-2 h-4 w-4" />
                        )}
                        Gerar
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleExport}
                        disabled={!reportData}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {reportData && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Relatório Gerado</CardTitle>
                    <CardDescription>
                      Relatório de {reportType === 'reserved' ? 'Lotes Reservados' : reportType === 'sold' ? 'Lotes Vendidos' : 'Lotes Disponíveis'} gerado com sucesso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Período</p>
                        <p className="font-medium">
                          {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Lotes</p>
                        <p className="font-medium">{reportData.totalLots.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="font-medium">{formatCurrency(reportData.totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Geração</p>
                        <p className="font-medium">{format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}