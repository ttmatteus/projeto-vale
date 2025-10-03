import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface TransactionData {
  id?: string;
  clientId: string;
  assetId?: string;
  lotId?: string;
  type: 'BUY' | 'SELL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RESERVE' | 'CANCEL_RESERVE';
  quantity: number;
  price: number;
  totalValue: number;
  commission?: number;
  taxes?: number;
  date: string;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const lotId = searchParams.get('lotId');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    
    const prisma = new PrismaClient();
    
    let whereClause: any = {};
    
    if (clientId) whereClause.clientId = clientId;
    if (lotId) whereClause.lotId = lotId;
    if (type) whereClause.type = type;
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, email: true }
          },
          lot: {
            select: { id: true, quadra: true, lote: true, empreendimento: true }
          }
        }
      }),
      prisma.transaction.count({ where: whereClause })
    ]);
    
    await prisma.$disconnect();
    
    const formattedData: TransactionData[] = transactions.map(transaction => ({
      id: transaction.id,
      clientId: transaction.clientId,
      assetId: transaction.assetId || undefined,
      lotId: transaction.lotId || undefined,
      type: transaction.type,
      quantity: transaction.quantity,
      price: transaction.price,
      totalValue: transaction.totalValue,
      commission: transaction.commission || undefined,
      taxes: transaction.taxes || undefined,
      date: transaction.date.toISOString().split('T')[0],
      status: transaction.status,
      notes: transaction.notes || undefined,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString()
    }));
    
    const response = NextResponse.json({
      data: formattedData,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    return response;
    
  } catch (error) {
    console.error('Erro na API de transações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const requiredFields = ['clientId', 'type', 'quantity', 'price', 'totalValue', 'date'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo '${field}' é obrigatório` },
          { status: 400 }
        );
      }
    }
    
    // Validate transaction type
    const validTypes = ['BUY', 'SELL', 'TRANSFER_IN', 'TRANSFER_OUT', 'RESERVE', 'CANCEL_RESERVE'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Tipo de transação inválido' },
        { status: 400 }
      );
    }
    
    // Validate date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json(
        { error: 'Data inválida. Use o formato YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    const prisma = new PrismaClient();
    
    try {
      // Check if client exists
      const client = await prisma.client.findUnique({
        where: { id: body.clientId }
      });
      
      if (!client) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }
      
      // If lotId is provided, check if lot exists
      if (body.lotId) {
        const lot = await prisma.lot.findUnique({
          where: { id: body.lotId }
        });
        
        if (!lot) {
          return NextResponse.json(
            { error: 'Lote não encontrado' },
            { status: 404 }
          );
        }
      }
      
      const newTransaction = await prisma.transaction.create({
        data: {
          clientId: body.clientId,
          assetId: body.assetId || null,
          lotId: body.lotId || null,
          type: body.type,
          quantity: parseInt(body.quantity),
          price: parseFloat(body.price),
          totalValue: parseFloat(body.totalValue),
          commission: parseFloat(body.commission || '0'),
          taxes: parseFloat(body.taxes || '0'),
          date: new Date(body.date),
          status: body.status || 'COMPLETED',
          notes: body.notes || null
        },
        include: {
          client: {
            select: { id: true, name: true, email: true }
          },
          lot: {
            select: { id: true, quadra: true, lote: true, empreendimento: true }
          }
        }
      });
      
      const responseTransaction: TransactionData = {
        id: newTransaction.id,
        clientId: newTransaction.clientId,
        assetId: newTransaction.assetId || undefined,
        lotId: newTransaction.lotId || undefined,
        type: newTransaction.type,
        quantity: newTransaction.quantity,
        price: newTransaction.price,
        totalValue: newTransaction.totalValue,
        commission: newTransaction.commission || undefined,
        taxes: newTransaction.taxes || undefined,
        date: newTransaction.date.toISOString().split('T')[0],
        status: newTransaction.status,
        notes: newTransaction.notes || undefined,
        createdAt: newTransaction.createdAt.toISOString(),
        updatedAt: newTransaction.updatedAt.toISOString()
      };
      
      return NextResponse.json({
        data: responseTransaction,
        message: 'Transação criada com sucesso'
      });
      
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}