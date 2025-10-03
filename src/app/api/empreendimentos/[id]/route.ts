import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empreendimento = await db.empreendimento.findUnique({
      where: {
        id: params.id,
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
    });

    if (!empreendimento) {
      return NextResponse.json(
        { error: 'Empreendimento not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(empreendimento);
  } catch (error) {
    console.error('Error fetching empreendimento:', error);
    return NextResponse.json(
      { error: 'Failed to fetch empreendimento' },
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
      descricao,
      endereco,
      cidade,
      estado,
      pais,
      areaTotal,
      areaUtil,
      quantidadeLotes,
      valorTotal,
      status,
    } = body;

    const empreendimento = await db.empreendimento.update({
      where: { id: params.id },
      data: {
        nome: nome || undefined,
        descricao: descricao !== undefined ? descricao : undefined,
        endereco: endereco !== undefined ? endereco : undefined,
        cidade: cidade !== undefined ? cidade : undefined,
        estado: estado !== undefined ? estado : undefined,
        pais: pais !== undefined ? pais : undefined,
        areaTotal: areaTotal !== undefined ? parseFloat(areaTotal) : undefined,
        areaUtil: areaUtil !== undefined ? parseFloat(areaUtil) : undefined,
        quantidadeLotes: quantidadeLotes !== undefined ? parseInt(quantidadeLotes) : undefined,
        valorTotal: valorTotal !== undefined ? parseFloat(valorTotal) : undefined,
        status: status || undefined,
      },
      include: {
        quadras: true,
        lots: true,
      },
    });

    return NextResponse.json(empreendimento);
  } catch (error) {
    console.error('Error updating empreendimento:', error);
    return NextResponse.json(
      { error: 'Failed to update empreendimento' },
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
    const empreendimento = await db.empreendimento.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedBy: 'system', // You might want to get this from the authenticated user
      },
    });

    return NextResponse.json({ message: 'Empreendimento deleted successfully' });
  } catch (error) {
    console.error('Error deleting empreendimento:', error);
    return NextResponse.json(
      { error: 'Failed to delete empreendimento' },
      { status: 500 }
    );
  }
}