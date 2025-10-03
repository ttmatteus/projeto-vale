import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      instancia,
      CRECI,
      empreendimento,
      lote,
      quadra,
      status
    } = body;

    // Validar campos obrigatórios
    if (!instancia || !CRECI || !empreendimento || !lote || !quadra || !status) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios: instancia, CRECI, empreendimento, lote, quadra, status' },
        { status: 400 }
      );
    }

    // Validar status permitidos
    const validStatuses = ['Reservado', 'Em Proposta'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status deve ser "Reservado" ou "Em Proposta"' },
        { status: 400 }
      );
    }

    // Buscar o lote pelo empreendimento, quadra e lote
    const lot = await db.lot.findFirst({
      where: {
        empreendimento: empreendimento,
        quadra: quadra,
        lote: lote,
        status: 'DISPONÍVEL' // Apenas lotes disponíveis podem ser reservados
      }
    });

    if (!lot) {
      return NextResponse.json(
        { error: 'Lote não encontrado ou não está disponível para reserva' },
        { status: 404 }
      );
    }

    // Buscar usuário pelo CRECI
    const user = await db.user.findFirst({
      where: {
        creci: CRECI,
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado com o CRECI informado ou usuário inativo' },
        { status: 404 }
      );
    }

    // Atualizar o status do lote
    const updatedLot = await db.lot.update({
      where: { id: lot.id },
      data: {
        status: status === 'Reservado' ? 'RESERVADO' : 'EM PROPOSTA',
        reservedBy: user.id,
        reservedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Verificar se já existe um cliente para este usuário
    let client = await db.client.findFirst({
      where: {
        email: user.email || `${user.identifier}@temp.com`
      }
    });

    // Se não existir, criar um cliente temporário
    if (!client) {
      client = await db.client.create({
        data: {
          name: user.name || `Cliente ${user.identifier}`,
          email: user.email || `${user.identifier}@temp.com`,
          document: `DOC-${user.identifier}`,
          phone: '',
          address: '',
          city: '',
          state: '',
          country: 'Brasil'
        }
      });
    }

    // Criar uma transação para registrar a reserva
    const transaction = await db.transaction.create({
      data: {
        clientId: client.id,
        lotId: lot.id,
        type: status === 'Reservado' ? 'RESERVE' : 'TRANSFER_IN',
        quantity: 1,
        price: lot.valor,
        totalValue: lot.valor,
        date: new Date(),
        status: 'COMPLETED',
        notes: `Reserva realizada via API - Instância: ${instancia}, CRECI: ${CRECI}`
      }
    });

    // Criar uma notificação para o usuário
    const notification = await db.notification.create({
      data: {
        title: status === 'Reservado' ? 'Lote Reservado' : 'Proposta Enviada',
        message: `O lote ${quadra}-${lote} do empreendimento ${empreendimento} foi ${status === 'Reservado' ? 'reservado' : 'proposto'} com sucesso.`,
        type: 'SUCCESS',
        userId: user.id
      }
    });

    // Retornar resposta de sucesso
    return NextResponse.json({
      success: true,
      message: `Lote ${status === 'Reservado' ? 'reservado' : 'proposto'} com sucesso`,
      data: {
        lot: {
          id: updatedLot.id,
          empreendimento: updatedLot.empreendimento,
          quadra: updatedLot.quadra,
          lote: updatedLot.lote,
          status: updatedLot.status,
          reservedAt: updatedLot.reservedAt
        },
        user: {
          id: user.id,
          name: user.name,
          creci: user.creci
        },
        transaction: {
          id: transaction.id,
          type: transaction.type,
          totalValue: transaction.totalValue
        },
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message
        }
      }
    });

  } catch (error) {
    console.error('Erro ao processar reserva:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar reserva' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Buscar todas as reservas (lotes com status RESERVADO ou EM PROPOSTA)
    const reservations = await db.lot.findMany({
      where: {
        status: {
          in: ['RESERVADO', 'EM PROPOSTA']
        },
        reservedAt: {
          not: null
        }
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            creci: true
          }
        }
      },
      orderBy: {
        reservedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: reservations.map(reservation => ({
        id: reservation.id,
        empreendimento: reservation.empreendimento,
        quadra: reservation.quadra,
        lote: reservation.lote,
        area: reservation.area,
        valor: reservation.valor,
        status: reservation.status,
        reservedAt: reservation.reservedAt,
        reservedBy: reservation.reservedBy,
        manager: reservation.manager
      }))
    });

  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar reservas' },
      { status: 500 }
    );
  }
}