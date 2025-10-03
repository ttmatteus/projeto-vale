import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const prisma = new PrismaClient();
    
    try {
      // Get basic statistics
      const [
        totalLots,
        availableLots,
        reservedLots,
        soldLots,
        inProposalLots,
        lotsWithValue
      ] = await Promise.all([
        prisma.lot.count(),
        prisma.lot.count({ where: { status: 'DISPONÍVEL' } }),
        prisma.lot.count({ where: { status: 'RESERVADO' } }),
        prisma.lot.count({ where: { status: 'VENDIDO' } }),
        prisma.lot.count({ where: { status: 'EM PROPOSTA' } }),
        prisma.lot.findMany({ select: { valor: true } })
      ]);
      
      // Calculate total value
      const totalValue = lotsWithValue.reduce((sum, lot) => sum + lot.valor, 0);
      
      // Get lot distribution by status
      const lotDistribution = [
        { name: 'Disponível', value: availableLots, color: '#22c55e' },
        { name: 'Reservado', value: reservedLots, color: '#f59e0b' },
        { name: 'Em Proposta', value: inProposalLots, color: '#8b5cf6' },
        { name: 'Vendido', value: soldLots, color: '#ef4444' }
      ];
      
      // Get reservations by month (mock data for now)
      const reservationsByMonth = [
        { month: 'Janeiro', reservations: 28 },
        { month: 'Fevereiro', reservations: 32 },
        { month: 'Março', reservations: 35 },
        { month: 'Abril', reservations: 29 },
        { month: 'Maio', reservations: 31 },
        { month: 'Junho', reservations: 27 },
        { month: 'Julho', reservations: 26 },
        { month: 'Agosto', reservations: 33 },
        { month: 'Setembro', reservations: 30 },
        { month: 'Outubro', reservations: 34 },
        { month: 'Novembro', reservations: 28 },
        { month: 'Dezembro', reservations: 25 }
      ];
      
      await prisma.$disconnect();
      
      const response = NextResponse.json({
        stats: {
          totalLots,
          availableLots,
          reservedLots,
          soldLots,
          inProposalLots,
          totalValue
        },
        charts: {
          lotDistribution,
          reservationsByMonth
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
      
      // Security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      
      return response;
      
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Erro na API de dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}