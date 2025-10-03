import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Identificador e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Find user by identifier (could be CRECI or email)
    const user = await db.user.findFirst({
      where: {
        OR: [
          { identifier: identifier },
          { email: identifier },
          { creci: identifier }
        ],
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    // In a real application, you would hash the password and compare
    // For now, we'll do a simple comparison (you should implement proper password hashing)
    if (user.password !== password) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Return user data without password
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
    
    // In a real application, you would:
    // 1. Store the session in the database
    // 2. Set HTTP-only cookies
    
    // For now, we'll set a session cookie with the user ID
    const response = NextResponse.json({
      ...userData,
      token: token, // Include JWT token in response
      message: "Login realizado com sucesso"
    });
    
    // Set session cookie
    response.cookies.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}