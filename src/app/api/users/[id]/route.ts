import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await db.user.findUnique({
      where: { 
        id: params.id,
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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
      identifier,
      password,
      role,
      isActive,
      email,
      creci,
    } = body;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if another user with the same identifier/email/creci exists
    if (identifier || email || creci) {
      const duplicateUser = await db.user.findFirst({
        where: {
          OR: [
            { identifier: identifier },
            { email: email },
            { creci: creci },
          ],
          AND: {
            id: { not: params.id },
          },
        },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: 'User with this identifier, email, or creci already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (nome !== undefined) updateData.name = nome;
    if (identifier !== undefined) updateData.identifier = identifier;
    if (password !== undefined) updateData.password = password; // In a real app, you should hash this password
    if (role !== undefined) updateData.role = role === 'ADMIN' ? 'ADMIN' : 'USER';
    if (isActive !== undefined) updateData.isActive = isActive;
    if (email !== undefined) updateData.email = email;
    if (creci !== undefined) updateData.creci = creci;

    const user = await db.user.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete - set isActive to false instead of deletedAt
    const user = await db.user.update({
      where: { id: params.id },
      data: {
        isActive: false, // User não tem campo deletedAt, usar isActive
      },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}