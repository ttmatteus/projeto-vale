import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Configurar CORS para rotas de API
  if (pathname.startsWith('/api/')) {
   
    const response = NextResponse.next();
    
    // Obter a origem da requisição
    const origin = request.headers.get('origin');
    
    // Lista de origens permitidas (para desenvolvimento e produção)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080'
    ];
    
    // Verificar se a origem está na lista de permitidas
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);
    
    // Log para depuração (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('CORS Request:', {
        origin,
        method: request.method,
        pathname,
        isAllowedOrigin
      });
    }
    
    // Se for uma origem permitida, definir o header CORS
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Lidar com preflight requests
    if (request.method === 'OPTIONS') {
      const optionsResponse = new NextResponse(null, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
      
      // Adicionar a origem se for permitida
      if (isAllowedOrigin) {
        optionsResponse.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      // Log para depuração de preflight
      if (process.env.NODE_ENV === 'development') {
        console.log('CORS Preflight Response:', {
          origin,
          allowedOrigin: optionsResponse.headers.get('Access-Control-Allow-Origin')
        });
      }
      
      return optionsResponse;
    }
    
    return response;
  }
  
  // Obter o cookie de sessão
  const sessionCookie = request.cookies.get('session');
  
  // Definir rotas públicas que não requerem autenticação
  const publicRoutes = ['/'];
  
  // Definir rotas de admin
  const adminRoutes = ['/dash-admin', '/lots', '/reports', '/settings'];
  
  // Definir rotas de usuário
  const userRoutes = ['/my-lots'];
  
  // Se está em uma rota pública, permitir acesso
  if (publicRoutes.includes(pathname)) {
    // Se já está autenticado e tenta acessar login, redirecionar conforme o papel
    if (sessionCookie) {
      // Para simplificar, vamos redirecionar para a validação no cliente
      return NextResponse.next();
    }
    return NextResponse.next();
  }
  
  // Se não está autenticado e tenta acessar uma rota protegida, redirecionar para login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Se está autenticado, verificar permissões baseado no papel do usuário
 
  // O middleware só garante que o usuário está autenticado
  
  // Permitir acesso a todas as rotas para usuários autenticados
  // A validação detalhada de permissões será feita pelo AuthGuard no cliente
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Correspondere a todos os caminhos de requisição exceto:
     * - _next/static (arquivos estáticos do Next.js)
     * - _next/image (otimização de imagens do Next.js)
     * - favicon.ico (ícone do site)
     * - arquivos estáticos da pasta public (imagens, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp).*)',
  ],
};