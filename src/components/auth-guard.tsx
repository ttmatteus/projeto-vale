"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// Constantes centralizadas para rotas admin
const ADMIN_ROUTES = new Set(["/dash-admin", "/lots", "/reports", "/settings"]);
const PUBLIC_ROUTES = new Set(["/"]);

// Tipos para melhor tipagem
type UserRole = "admin" | "user" | undefined;
type AuthState = "loading" | "authenticated" | "unauthenticated";

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("loading");

  // Sanitização de dados do usuário
  const sanitizedUser = useMemo(() => {
    if (!user) return null;
    
    return {
      id: user.id?.toString() || "",
      role: (user.role === "admin" || user.role === "user") ? user.role : undefined,
      name: typeof user.name === "string" ? user.name.trim() : "",
      email: typeof user.email === "string" ? user.email.trim().toLowerCase() : "",
    };
  }, [user]);

  // Verificação de permissões de forma otimizada
  const hasAccess = useCallback(() => {
    if (authState !== "authenticated" || !sanitizedUser) return false;
    
    if (requireAdmin && sanitizedUser.role !== "admin") return false;
    
    if (sanitizedUser.role === "user" && ADMIN_ROUTES.has(pathname)) return false;
    
    return true;
  }, [authState, sanitizedUser, requireAdmin, pathname]);

  // Determinar rota de redirecionamento
  const getRedirectPath = useCallback(() => {
    if (!sanitizedUser) return null; // Não redirecionar se não estiver autenticado
    
    if (pathname === "/") {
      return sanitizedUser.role === "admin" ? "/dash-admin" : "/my-lots";
    }
    
    if (requireAdmin && sanitizedUser.role !== "admin") {
      return "/my-lots";
    }
    
    if (sanitizedUser.role === "user" && ADMIN_ROUTES.has(pathname)) {
      return "/my-lots";
    }
    
    return null;
  }, [sanitizedUser, pathname, requireAdmin]);

  // Inicialização otimizada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100); // Aumentado para evitar race conditions

    return () => clearTimeout(timer);
  }, []);

  // Gerenciamento de estado de autenticação
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const newAuthState: AuthState = isAuthenticated ? "authenticated" : "unauthenticated";
    setAuthState(newAuthState);
  }, [isInitialized, isLoading, isAuthenticated]);

  // Lógica de redirecionamento centralizada e otimizada
  useEffect(() => {
    if (authState === "loading" || !isInitialized || isLoading) return;

    const redirectPath = getRedirectPath();
    if (redirectPath && redirectPath !== pathname) {
      console.log('AuthGuard: Redirecting to', redirectPath);
      router.push(redirectPath);
      return;
    }
  }, [authState, isInitialized, isLoading, getRedirectPath, router, pathname]);

  // Estados de loading otimizados
  if (isLoading || !isInitialized || authState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Verificando acesso...
          </p>
        </div>
      </div>
    );
  }

  // Renderização condicional otimizada
  if (authState === "unauthenticated") {
    // Se não está autenticado, mostrar a página de login
    return <>{children}</>;
  }

  // Verificação de acesso antes de renderizar conteúdo sensível
  if (!hasAccess()) {
    return null; // Será redirecionado pelo useEffect
  }

  // Renderização do conteúdo protegido
  return <>{children}</>;
}