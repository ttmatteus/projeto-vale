import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface LotData {
  id?: string;
  empreendimento: string;
  quadra: string;
  lote: string;
  area: number;
  valor: number;
  entrada: number;
  porcentagem?: number;
  valorPorMetro?: number;
  status: 'DISPONÍVEL' | 'RESERVADO' | 'EM PROPOSTA' | 'VENDIDO';
  observacoes?: string;
  reservedAt?: string;
  reservedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Extrair parâmetros da query string
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const status = searchParams.get('status')?.toUpperCase() as 'DISPONÍVEL' | 'RESERVADO' | undefined;
    const empreendimento = searchParams.get('empreendimento')?.trim();
    const quadra = searchParams.get('quadra')?.trim();
    const lote = searchParams.get('lote')?.trim();
    
    // Inicializar Prisma Client
    const prisma = new PrismaClient();
    
    // Construir a query WHERE dinamicamente
    let whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (empreendimento) {
      whereClause.empreendimento = {
        contains: empreendimento,
        mode: 'insensitive' as const
      };
    }
    
    if (quadra) {
      whereClause.quadra = {
        contains: quadra,
        mode: 'insensitive' as const
      };
    }
    
    if (lote) {
      whereClause.lote = {
        contains: lote,
        mode: 'insensitive' as const
      };
    }
    
    // Buscar lotes no banco de dados com os filtros
    let lotsData: any[] = [];
    try {
      lotsData = await prisma.lot.findMany({
        where: whereClause,
        select: {
          id: true,
          empreendimento: true,
          quadra: true,
          lote: true,
          area: true,
          valor: true,
          entrada: true,
          porcentagem: true,
          valorPorMetro: true,
          status: true,
          observacoes: true,
          reservedAt: true,
          reservedBy: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { empreendimento: 'asc' },
          { quadra: 'asc' },
          { lote: 'asc' }
        ],
        // Limitar resultados para prevenir sobrecarga
        take: 1000
      });
    } catch (dbError) {
      console.error('Erro ao consultar banco de dados:', dbError);
      // Retornar array vazio em caso de erro na consulta
      lotsData = [];
    } finally {
      await prisma.$disconnect();
    }
    
    // Formatar os dados de resposta
    const formattedData: LotData[] = lotsData.map(lot => ({
      id: lot.id,
      empreendimento: lot.empreendimento || '',
      quadra: lot.quadra || '',
      lote: lot.lote || '',
      area: lot.area || 0,
      valor: Number(lot.valor) || 0,
      entrada: Number(lot.entrada) || 0,
      porcentagem: lot.porcentagem ? Number(lot.porcentagem) : undefined,
      valorPorMetro: lot.valorPorMetro ? Number(lot.valorPorMetro) : undefined,
      status: (lot.status as 'DISPONÍVEL' | 'RESERVADO' | 'EM PROPOSTA' | 'VENDIDO') || 'DISPONÍVEL',
      observacoes: lot.observacoes || '',
      reservedAt: lot.reservedAt?.toISOString(),
      reservedBy: lot.reservedBy || '',
      createdAt: lot.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: lot.updatedAt?.toISOString() || new Date().toISOString()
    }));
    
    // Adicionar headers de segurança
    const response = NextResponse.json({
      data: formattedData,
      metadata: {
        total: formattedData.length,
        filters: {
          status: status || 'TODOS',
          empreendimento: empreendimento || 'TODOS',
          quadra: quadra || 'TODOS',
          lote: lote || 'TODOS'
        },
        timestamp: new Date().toISOString()
      }
    });
    
    // Headers de segurança
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Erro na API de lotes:', error);
    
    // Retornar erro genérico para não expor detalhes internos
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Método POST - Criar novo lote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos obrigatórios
    const requiredFields = ['empreendimento', 'quadra', 'lote', 'area', 'valor', 'entrada', 'status'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo '${field}' é obrigatório` },
          { status: 400 }
        );
      }
    }
    
    // Validar status
    const validStatuses = ['DISPONÍVEL', 'RESERVADO', 'EM PROPOSTA', 'VENDIDO'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: DISPONÍVEL, RESERVADO, EM PROPOSTA ou VENDIDO' },
        { status: 400 }
      );
    }
    
    const prisma = new PrismaClient();
    
    try {
      // Verificar se já existe um lote com a mesma combinação de empreendimento, quadra e lote
      const existingLot = await prisma.lot.findFirst({
        where: {
          empreendimento: body.empreendimento,
          quadra: body.quadra,
          lote: body.lote
        }
      });
      
      if (existingLot) {
        return NextResponse.json(
          { error: 'Já existe um lote com esta combinação de empreendimento, quadra e lote' },
          { status: 409 }
        );
      }
      
      // Criar novo lote
      const newLot = await prisma.lot.create({
        data: {
          empreendimento: body.empreendimento,
          quadra: body.quadra,
          lote: body.lote,
          area: parseFloat(body.area),
          valor: parseFloat(body.valor),
          entrada: parseFloat(body.entrada),
          porcentagem: body.porcentagem ? parseFloat(body.porcentagem) : null,
          valorPorMetro: body.valorPorMetro ? parseFloat(body.valorPorMetro) : null,
          status: body.status,
          observacoes: body.observacoes || null,
          reservedAt: body.reservedAt ? new Date(body.reservedAt) : null,
          reservedBy: body.reservedBy || null
        }
      });
      
      // Formatar resposta
      const responseLot: LotData = {
        id: newLot.id,
        empreendimento: newLot.empreendimento,
        quadra: newLot.quadra,
        lote: newLot.lote,
        area: newLot.area,
        valor: newLot.valor,
        entrada: newLot.entrada,
        porcentagem: newLot.porcentagem ? Number(newLot.porcentagem) : undefined,
        valorPorMetro: newLot.valorPorMetro ? Number(newLot.valorPorMetro) : undefined,
        status: newLot.status as any,
        observacoes: newLot.observacoes || undefined,
        reservedAt: newLot.reservedAt?.toISOString(),
        reservedBy: newLot.reservedBy || undefined,
        createdAt: newLot.createdAt.toISOString(),
        updatedAt: newLot.updatedAt.toISOString()
      };
      
      return NextResponse.json({
        data: responseLot,
        message: 'Lote criado com sucesso'
      });
      
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Erro ao criar lote:', error);
    
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

// Método PUT - Atualizar lote existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID do lote é obrigatório' },
        { status: 400 }
      );
    }
    
    const prisma = new PrismaClient();
    
    try {
      // Verificar se o lote existe
      const existingLot = await prisma.lot.findUnique({
        where: { id: body.id }
      });
      
      if (!existingLot) {
        return NextResponse.json(
          { error: 'Lote não encontrado' },
          { status: 404 }
        );
      }
      
      // Preparar dados para atualização
      const updateData: any = {};
      
      // Campos opcionais para atualização
      const optionalFields = ['empreendimento', 'quadra', 'lote', 'area', 'valor', 'entrada', 'porcentagem', 'valorPorMetro', 'status', 'observacoes'];
      for (const field of optionalFields) {
        if (body[field] !== undefined) {
          updateData[field] = field === 'area' || field === 'valor' || field === 'entrada' || field === 'porcentagem' || field === 'valorPorMetro'
            ? parseFloat(body[field]) 
            : body[field];
        }
      }
      
      // Se o status mudou para RESERVADO, adicionar data de reserva
      if (body.status === 'RESERVADO' && existingLot.status !== 'RESERVADO') {
        updateData.reservedAt = new Date();
        updateData.reservedBy = body.reservedBy || 'user1'; // Usuário padrão
      }
      
      // Se o status mudou de RESERVADO para outro, limpar data de reserva
      if (body.status !== 'RESERVADO' && existingLot.status === 'RESERVADO') {
        updateData.reservedAt = null;
        updateData.reservedBy = null;
      }
      
      // Atualizar lote
      const updatedLot = await prisma.lot.update({
        where: { id: body.id },
        data: updateData
      });
      
      // Formatar resposta
      const responseLot: LotData = {
        id: updatedLot.id,
        empreendimento: updatedLot.empreendimento,
        quadra: updatedLot.quadra,
        lote: updatedLot.lote,
        area: updatedLot.area,
        valor: updatedLot.valor,
        entrada: updatedLot.entrada,
        porcentagem: updatedLot.porcentagem ? Number(updatedLot.porcentagem) : undefined,
        valorPorMetro: updatedLot.valorPorMetro ? Number(updatedLot.valorPorMetro) : undefined,
        status: updatedLot.status as any,
        observacoes: updatedLot.observacoes || undefined,
        reservedAt: updatedLot.reservedAt?.toISOString(),
        reservedBy: updatedLot.reservedBy || undefined,
        createdAt: updatedLot.createdAt.toISOString(),
        updatedAt: updatedLot.updatedAt.toISOString()
      };
      
      return NextResponse.json({
        data: responseLot,
        message: 'Lote atualizado com sucesso'
      });
      
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Erro ao atualizar lote:', error);
    
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

// Método DELETE - Excluir lote
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do lote é obrigatório' },
        { status: 400 }
      );
    }
    
    const prisma = new PrismaClient();
    
    try {
      // Verificar se o lote existe
      const existingLot = await prisma.lot.findUnique({
        where: { id }
      });
      
      if (!existingLot) {
        return NextResponse.json(
          { error: 'Lote não encontrado' },
          { status: 404 }
        );
      }
      
      // Excluir lote
      await prisma.lot.delete({
        where: { id }
      });
      
      return NextResponse.json({
        message: 'Lote excluído com sucesso'
      });
      
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Erro ao excluir lote:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}