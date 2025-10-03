import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface ClientData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  document: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    
    const prisma = new PrismaClient();
    
    let whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { document: { contains: search, mode: 'insensitive' as const } }
      ];
    }
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.client.count({ where: whereClause })
    ]);
    
    await prisma.$disconnect();
    
    const formattedData: ClientData[] = clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone || undefined,
      document: client.document,
      address: client.address || undefined,
      city: client.city || undefined,
      state: client.state || undefined,
      country: client.country || undefined,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString()
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
    console.error('Erro na API de clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const requiredFields = ['name', 'email', 'document'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo '${field}' é obrigatório` },
          { status: 400 }
        );
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }
    
    const prisma = new PrismaClient();
    
    try {
      // Check if client already exists
      const existingClient = await prisma.client.findFirst({
        where: {
          OR: [
            { email: body.email },
            { document: body.document }
          ]
        }
      });
      
      if (existingClient) {
        return NextResponse.json(
          { error: 'Cliente com este email ou documento já existe' },
          { status: 409 }
        );
      }
      
      const newClient = await prisma.client.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          document: body.document,
          address: body.address || null,
          city: body.city || null,
          state: body.state || null,
          country: body.country || 'Brasil'
        }
      });
      
      const responseClient: ClientData = {
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || undefined,
        document: newClient.document,
        address: newClient.address || undefined,
        city: newClient.city || undefined,
        state: newClient.state || undefined,
        country: newClient.country || undefined,
        createdAt: newClient.createdAt.toISOString(),
        updatedAt: newClient.updatedAt.toISOString()
      };
      
      return NextResponse.json({
        data: responseClient,
        message: 'Cliente criado com sucesso'
      });
      
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    
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