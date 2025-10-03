import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const empreendimentos = await db.empreendimento.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        quadras: {
          where: {
            deletedAt: null,
          },
        },
        lots: true, // Lots não tem campo deletedAt
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(empreendimentos);
  } catch (error) {
    console.error('Error fetching empreendimentos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch empreendimentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      descricao,
      endereco,
      cidade,
      estado,
      pais,
      areaTotal,
      areaUtil,
      quantidadeLotes,
      valorTotal,
    } = body;

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome is required' },
        { status: 400 }
      );
    }

    const empreendimento = await db.empreendimento.create({
      data: {
        nome,
        descricao,
        endereco,
        cidade,
        estado,
        pais,
        areaTotal: areaTotal ? parseFloat(areaTotal) : null,
        areaUtil: areaUtil ? parseFloat(areaUtil) : null,
        quantidadeLotes: quantidadeLotes ? parseInt(quantidadeLotes) : null,
        valorTotal: valorTotal ? parseFloat(valorTotal) : null,
      },
      include: {
        quadras: true,
        lots: true,
      },
    });

    return NextResponse.json(empreendimento, { status: 201 });
  } catch (error) {
    console.error('Error creating empreendimento:', error);
    return NextResponse.json(
      { error: 'Failed to create empreendimento' },
      { status: 500 }
    );
  }
}