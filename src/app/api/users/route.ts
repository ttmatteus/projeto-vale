import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const users = await db.user.findMany({
      where: {
        isActive: true, // User não tem campo deletedAt, usar isActive
      },
      select: {
        id: true,
        identifier: true,
        role: true,
        name: true,
        email: true,
        creci: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      identifier,
      password,
      role,
      isActive,
      email,
      creci,
    } = body;

    if (!nome || !identifier || !password || !role) {
      return NextResponse.json(
        { error: 'Nome, identifier, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user with this identifier already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { identifier: identifier },
          { email: email },
          { creci: creci },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this identifier, email, or creci already exists' },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        name: nome,
        identifier: identifier,
        password: password, // In a real app, you should hash this password
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        isActive: isActive !== undefined ? isActive : true,
        email: email,
        creci: creci,
      },
      select: {
        id: true,
        identifier: true,
        role: true,
        name: true,
        email: true,
        creci: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}