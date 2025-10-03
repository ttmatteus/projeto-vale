import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    let whereClause = {};
    if (!includeDeleted) {
      whereClause = {
        deletedAt: null
      };
    }

    const paymentConditions = await db.paymentCondition.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Converter porcentagens de JSON string para array
    const formattedConditions = paymentConditions.map(condition => ({
      ...condition,
      porcentagens: JSON.parse(condition.porcentagens)
    }));

    return NextResponse.json(formattedConditions);
  } catch (error) {
    console.error('Erro ao buscar condições de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar condições de pagamento' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, porcentagens, status } = body;

    if (!nome || !porcentagens || !Array.isArray(porcentagens)) {
      return NextResponse.json(
        { error: 'Nome e porcentagens são obrigatórios' },
        { status: 400 }
      );
    }

    const paymentCondition = await db.paymentCondition.create({
      data: {
        nome,
        porcentagens: JSON.stringify(porcentagens),
        status: status || 'ATIVO'
      }
    });

    // Retornar com porcentagens como array
    const formattedCondition = {
      ...paymentCondition,
      porcentagens: JSON.parse(paymentCondition.porcentagens)
    };

    return NextResponse.json(formattedCondition, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar condição de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar condição de pagamento' },
      { status: 500 }
    );
  }
}