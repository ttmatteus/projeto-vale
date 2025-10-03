import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const prisma = new PrismaClient();
    
    try {
      // Build date filter
      let dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter = {
          date: {}
        };
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) dateFilter.date.lte = new Date(endDate);
      }
      
      // Get transactions
      const transactions = await prisma.transaction.findMany({
        where: dateFilter,
        select: {
          type: true,
          totalValue: true,
          commission: true,
          taxes: true,
          date: true
        }
      });
      
      // Calculate financial metrics
      const totalRevenue = transactions
        .filter(t => t.type === 'BUY' || t.type === 'SELL')
        .reduce((sum, t) => sum + t.totalValue, 0);
      
      const totalCommission = transactions.reduce((sum, t) => sum + t.commission, 0);
      const totalTaxes = transactions.reduce((sum, t) => sum + t.taxes, 0);
      
      // Group transactions by month
      const byMonth = new Map<string, {
        month: string;
        revenue: number;
        commission: number;
        taxes: number;
        transactions: number;
      }>();
      
      transactions.forEach(transaction => {
        const month = transaction.date.toISOString().substring(0, 7); // YYYY-MM
        const monthName = new Date(transaction.date).toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        if (!byMonth.has(month)) {
          byMonth.set(month, {
            month: monthName,
            revenue: 0,
            commission: 0,
            taxes: 0,
            transactions: 0
          });
        }
        
        const monthData = byMonth.get(month)!;
        if (transaction.type === 'BUY' || transaction.type === 'SELL') {
          monthData.revenue += transaction.totalValue;
        }
        monthData.commission += transaction.commission;
        monthData.taxes += transaction.taxes;
        monthData.transactions += 1;
      });
      
      await prisma.$disconnect();
      
      const response = NextResponse.json({
        totalRevenue,
        totalCommission,
        totalTaxes,
        transactions: transactions.length,
        byMonth: Array.from(byMonth.values()).sort((a, b) => 
          new Date(a.month).getTime() - new Date(b.month).getTime()
        ),
        metadata: {
          period: {
            start: startDate || 'início',
            end: endDate || 'fim'
          },
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
    console.error('Erro na API de relatórios financeiros:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}