import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    // Get the user ID from the session cookie
    const userId = sessionCookie.value;
    
    // Find the user by ID
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        identifier: true,
        role: true,
        name: true,
        email: true,
        creci: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Return user data without sensitive information
    const userData = {
      id: user.id,
      identifier: user.identifier,
      role: user.role === 'ADMIN' ? 'admin' : 'user',
      name: user.name,
      email: user.email,
      creci: user.creci,
    };

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        identifier: user.identifier,
        role: user.role === 'ADMIN' ? 'admin' : 'user',
        name: user.name,
        email: user.email,
        creci: user.creci,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      ...userData,
      token: token
    });
  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}