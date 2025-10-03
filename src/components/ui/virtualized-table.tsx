"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Trash2, Clock, AlertTriangle } from "lucide-react";

interface VirtualizedTableProps {
  lots: Array<{
    id: string;
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
  }>;
  selectedLot: any;
  onLotClick: (lot: any) => void;
  onEdit: (lot: any) => void;
  onDelete: (lot: any) => void;
  getStatusBadge: (status: string) => JSX.Element;
  formatCurrency: (value: number) => string;
  getReservationDaysLeft?: (lot: any) => number | null;
  isLoading: boolean;
}

const ROW_HEIGHT = 60;
const BUFFER_ROWS = 5;

export function VirtualizedTable({
  lots,
  selectedLot,
  onLotClick,
  onEdit,
  onDelete,
  getStatusBadge,
  formatCurrency,
  getReservationDaysLeft,
  isLoading
}: VirtualizedTableProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2 text-muted-foreground">Carregando lotes...</span>
      </div>
    );
  }

  const totalHeight = lots.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const endIndex = Math.min(
    lots.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_ROWS
  );

  const visibleLots = lots.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  const getReservationBadge = (daysLeft: number | null) => {
    if (daysLeft === null) return null;
    
    if (daysLeft <= 2) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {daysLeft}d
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{daysLeft} dias para a reserva expirar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (daysLeft <= 5) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {daysLeft}d
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{daysLeft} dias para a reserva expirar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {daysLeft}d
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{daysLeft} dias para a reserva expirar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  };

  const getStatusWithDaysLeft = (lot: any) => {
    const daysLeft = getReservationDaysLeft ? getReservationDaysLeft(lot) : null;
    
    if (lot.status === 'RESERVADO' && daysLeft !== null) {
      return (
        <div className="flex items-center gap-2">
          {getStatusBadge(lot.status)}
          {getReservationBadge(daysLeft)}
        </div>
      );
    }
    
    return getStatusBadge(lot.status);
  };

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="grid grid-cols-7 gap-4 p-4 border-b bg-muted/50">
        <div className="font-medium">Quadra</div>
        <div className="font-medium">Lt</div>
        <div className="font-medium">Área (m²)</div>
        <div className="font-medium">Valor (R$)</div>
        <div className="font-medium">Entrada (R$)</div>
        <div className="font-medium">Status</div>
        <div className="font-medium text-right">Ações</div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{ height: `${Math.min(containerHeight, totalHeight)}px` }}
        onScroll={handleScroll}
      >
        <div style={{ height: `${totalHeight}px` }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleLots.map((lot) => (
              <div
                key={lot.id}
                className={`grid grid-cols-7 gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                  selectedLot?.id === lot.id ? 'bg-muted' : ''
                }`}
                style={{ height: `${ROW_HEIGHT}px` }}
                onClick={() => onLotClick(lot)}
              >
                <div className="font-medium flex items-center">{lot.quadra}</div>
                <div className="flex items-center">{lot.lote}</div>
                <div className="flex items-center">{lot.area.toLocaleString('pt-BR')}</div>
                <div className="flex items-center font-medium">{formatCurrency(lot.valor)}</div>
                <div className="flex items-center font-medium">{formatCurrency(lot.entrada)}</div>
                <div className="flex items-center">
                  {getStatusWithDaysLeft(lot)}
                </div>
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(lot)}
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
                          onClick={() => onDelete(lot)}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}