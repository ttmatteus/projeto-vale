import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Buscar transações do tipo RESERVE do ano atual
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // 1º de janeiro do ano atual
    const endDate = new Date(currentYear, 11, 31); // 31 de dezembro do ano atual

    // Buscar transações de reserva
    const reserveTransactions = await db.transaction.findMany({
      where: {
        type: 'RESERVE',
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      select: {
        date: true,
      },
    });

    // Buscar lotes que foram reservados (baseado no status e data de reserva)
    const reservedLots = await db.lot.findMany({
      where: {
        status: 'RESERVADO',
        reservedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        reservedAt: true,
      },
    });

    // Inicializar array com todos os meses do ano
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const reservationsByMonth = monthNames.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0);

      // Contar reservas por transações
      const reserveCount = reserveTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      }).length;

      // Contar reservas por status do lote
      const lotReserveCount = reservedLots.filter(lot => {
        if (!lot.reservedAt) return false;
        const reservedDate = new Date(lot.reservedAt);
        return reservedDate >= monthStart && reservedDate <= monthEnd;
      }).length;

      // Total de reservas no mês (soma de ambas as fontes)
      const totalReservations = reserveCount + lotReserveCount;

      return {
        month,
        reservations: totalReservations,
      };
    });

    return NextResponse.json(reservationsByMonth);

  } catch (error) {
    console.error('Error fetching reservations by month:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations by month' },
      { status: 500 }
    );
  }
}