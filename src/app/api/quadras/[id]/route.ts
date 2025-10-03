import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quadra = await db.quadra.findUnique({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        empreendimento: true,
        lots: true, // Lots não tem campo deletedAt
      },
    });

    if (!quadra) {
      return NextResponse.json(
        { error: 'Quadra not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(quadra);
  } catch (error) {
    console.error('Error fetching quadra:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quadra' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      nome,
      empreendimentoId,
      areaTotal,
      quantidadeLotes,
      valorMetroQuadrado,
      status,
    } = body;

    const quadra = await db.quadra.update({
      where: { id: params.id },
      data: {
        nome: nome || undefined,
        empreendimentoId: empreendimentoId || undefined,
        areaTotal: areaTotal !== undefined ? parseFloat(areaTotal) : undefined,
        quantidadeLotes: quantidadeLotes !== undefined ? parseInt(quantidadeLotes) : undefined,
        valorMetroQuadrado: valorMetroQuadrado !== undefined ? parseFloat(valorMetroQuadrado) : undefined,
        status: status || undefined,
      },
      include: {
        empreendimento: true,
        lots: true,
      },
    });

    return NextResponse.json(quadra);
  } catch (error) {
    console.error('Error updating quadra:', error);
    return NextResponse.json(
      { error: 'Failed to update quadra' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete - set deletedAt and deletedBy
    const quadra = await db.quadra.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedBy: 'system', // You might want to get this from the authenticated user
      },
    });

    return NextResponse.json({ message: 'Quadra deleted successfully' });
  } catch (error) {
    console.error('Error deleting quadra:', error);
    return NextResponse.json(
      { error: 'Failed to delete quadra' },
      { status: 500 }
    );
  }
}