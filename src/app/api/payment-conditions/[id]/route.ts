import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { nome, porcentagens, status } = body;
    const { id } = params;

    if (!nome || !porcentagens || !Array.isArray(porcentagens)) {
      return NextResponse.json(
        { error: 'Nome e porcentagens são obrigatórios' },
        { status: 400 }
      );
    }

    const paymentCondition = await db.paymentCondition.update({
      where: { id },
      data: {
        nome,
        porcentagens: JSON.stringify(porcentagens),
        status: status || 'ATIVO',
        updatedAt: new Date()
      }
    });

    // Retornar com porcentagens como array
    const formattedCondition = {
      ...paymentCondition,
      porcentagens: JSON.parse(paymentCondition.porcentagens)
    };

    return NextResponse.json(formattedCondition);
  } catch (error) {
    console.error('Erro ao atualizar condição de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar condição de pagamento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hardDelete') === 'true';

    if (hardDelete) {
      // Exclusão permanente
      await db.paymentCondition.delete({
        where: { id }
      });
    } else {
      // Soft delete
      const deletedBy = request.headers.get('x-user-id') || 'Desconhecido';
      await db.paymentCondition.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({ message: 'Condição de pagamento excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir condição de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir condição de pagamento' },
      { status: 500 }
    );
  }
}