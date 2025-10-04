"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  identifier: string; // CRECI para admin, email para usuário comum
  role: "admin" | "user";
  name?: string;
  email?: string;
  creci?: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Primeiro, verificar se tem um token JWT no sessionStorage
        const storedToken = sessionStorage.getItem('jwtToken');
        if (storedToken) {
          setJwtToken(storedToken);
        }

        // Verificar se tem uma sessão válida fazendo uma requisição para validar o usuário
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          // Cookies são incluídos automaticamente pelo navegador
        });

        if (!isMounted) return; // Evitar atualizações se o componente foi desmontado

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
          
          // Se houver um token na resposta, armazenar
          if (userData.token) {
            setJwtToken(userData.token);
            sessionStorage.setItem('jwtToken', userData.token);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setJwtToken(null);
          sessionStorage.removeItem('jwtToken');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Falha na validação de autenticação:', error);
        setUser(null);
        setIsAuthenticated(false);
        setJwtToken(null);
        sessionStorage.removeItem('jwtToken');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: { identifier: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      
      });

      if (response.ok) {
        const userData = await response.json();
        // Atualizar estado imediatamente
        setUser(userData);
        setIsAuthenticated(true);
        
        // Armazenar token JWT se presente
        if (userData.token) {
          setJwtToken(userData.token);
          sessionStorage.setItem('jwtToken', userData.token);
        }
        
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Falha no login' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de rede' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
  
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setJwtToken(null);
      sessionStorage.removeItem('jwtToken');
      router.push("/");
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    jwtToken,
    login,
    logout,
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user"
  };
}