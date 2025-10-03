import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const quadras = await db.quadra.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        empreendimento: true,
        lots: true, // Lots não tem campo deletedAt
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(quadras);
  } catch (error) {
    console.error('Error fetching quadras:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quadras' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      empreendimentoId,
      areaTotal,
      quantidadeLotes,
      valorMetroQuadrado,
    } = body;

    if (!nome || !empreendimentoId) {
      return NextResponse.json(
        { error: 'Nome and empreendimentoId are required' },
        { status: 400 }
      );
    }

    // Check if empreendimento exists
    const empreendimento = await db.empreendimento.findUnique({
      where: { id: empreendimentoId },
    });

    if (!empreendimento) {
      return NextResponse.json(
        { error: 'Empreendimento not found' },
        { status: 404 }
      );
    }

    const quadra = await db.quadra.create({
      data: {
        nome,
        empreendimentoId,
        areaTotal: areaTotal ? parseFloat(areaTotal) : null,
        quantidadeLotes: quantidadeLotes ? parseInt(quantidadeLotes) : null,
        valorMetroQuadrado: valorMetroQuadrado ? parseFloat(valorMetroQuadrado) : null,
      },
      include: {
        empreendimento: true,
        lots: true,
      },
    });

    return NextResponse.json(quadra, { status: 201 });
  } catch (error) {
    console.error('Error creating quadra:', error);
    return NextResponse.json(
      { error: 'Failed to create quadra' },
      { status: 500 }
    );
  }
}