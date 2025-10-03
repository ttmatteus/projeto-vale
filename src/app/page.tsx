"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Eye, EyeOff, Mail, User, Shield, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

interface LoginCredentials {
  identifier: string;
  password: string;
}

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  const router = useRouter();
  const { login, user, isAuthenticated } = useAuth();
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Foco automático no primeiro input quando o componente é montado
  useEffect(() => {
    if (identifierRef.current) {
      identifierRef.current.focus();
    }
  }, []);

  // Lidar com redirecionamento se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === "admin" ? "/dash-admin" : "/my-lots";
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  // Temporizador de bloqueio
  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  // Função de sanitização de input
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };

  // Validação de email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação de CRECI (verificação básica de formato)
  const isValidCRECI = (creci: string): boolean => {
    const creciRegex = /^[0-9]{4,6}-[A-Z]{2}$/i;
    return creciRegex.test(creci) || /^\d+$/.test(creci);
  };

  // Validação de nome de usuário admin
  const isAdminUser = (identifier: string): boolean => {
    return identifier.toLowerCase() === 'admin';
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate identifier
    if (!credentials.identifier.trim()) {
      // Não mostrar erro para campo obrigatório
    } else {
      const sanitized = sanitizeInput(credentials.identifier);
      if (isValidEmail(sanitized)) {
        // Valid email format
      } else if (isValidCRECI(sanitized)) {
        // Valid CRECI format
      } else if (isAdminUser(sanitized)) {
        // Admin username
      } else {
        newErrors.identifier = "Formato de CRECI ou email inválido";
      }
    }

    // Validate password
    if (!credentials.password) {
      // Não mostrar erro para campo obrigatório
    } else if (credentials.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    const sanitizedValue = field === 'password' ? value : sanitizeInput(value);
    setCredentials(prev => ({ ...prev, [field]: sanitizedValue }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
  
    setTouched(prev => ({ ...prev, [field]: true }));
  };


  const handleBlur = (field: keyof LoginCredentials) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
 
    const newErrors: FormErrors = {};
    
    if (field === 'identifier' && touched.identifier) {
      if (credentials.identifier.trim()) {
        const sanitized = sanitizeInput(credentials.identifier);
        if (!isValidEmail(sanitized) && !isValidCRECI(sanitized) && !isAdminUser(sanitized)) {
          newErrors.identifier = "Formato de CRECI ou email inválido";
        }
      }
    }
    
    if (field === 'password' && touched.password) {
      if (credentials.password && credentials.password.length < 6) {
        newErrors.password = "Senha deve ter pelo menos 6 caracteres";
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
   
    if (isLocked) {
      setErrors({ general: `Conta temporariamente bloqueada. Tente novamente em ${lockoutTime} segundos.` });
      return;
    }

 
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      
      const sanitizedCredentials = {
        identifier: sanitizeInput(credentials.identifier),
        password: credentials.password, 
      };

    
      const result = await login(sanitizedCredentials);

      if (!result.success) {
    
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
    
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockoutTime(300); 
          setErrors({ general: "Muitas tentativas falhas. Conta bloqueada por 5 minutos." });
        } else {
          setErrors({ 
            general: result.error || "Credenciais inválidas. Tente novamente." 
          });
        }
        return;
      }

     
      setLoginAttempts(0);
      
     
      console.log("Login successful, redirecting...");

    } catch (err) {
      console.error("Login error:", err);
      setErrors({ 
        general: "Erro ao conectar com o servidor. Tente novamente mais tarde." 
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent, nextField?: React.RefObject<HTMLInputElement>) => {
    if (e.key === 'Enter' && nextField?.current) {
      e.preventDefault();
      nextField.current.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md px-4 space-y-4">
        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              Sistema de Gestão de Lotes
            </h1>
            <p className="text-muted-foreground text-sm">
              Acesso seguro à plataforma
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-sm mx-auto shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
  

            {/* General Error Alert */}
            {errors.general && (
              <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 py-2 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200 text-xs">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Identifier Field */}
              <div className="space-y-1">
                <Label htmlFor="identifier" className="text-xs font-medium text-foreground">
                  CRECI ou Email
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    ref={identifierRef}
                    id="identifier"
                    type="text"
                    placeholder="Digite seu CRECI ou email"
                    value={credentials.identifier}
                    onChange={(e) => handleInputChange('identifier', e.target.value)}
                    onBlur={() => handleBlur('identifier')}
                    onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                    disabled={isLoading || isLocked}
                    className={`h-10 pl-10 pr-4 text-sm transition-all duration-200 ${
                      errors.identifier 
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200' 
                        : 'border-border focus:border-primary focus:ring-primary/20'
                    } ${
                      touched.identifier && !errors.identifier 
                        ? 'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-200' 
                        : ''
                    }`}
                    aria-invalid={!!errors.identifier}
                    aria-describedby={errors.identifier ? "identifier-error" : undefined}
                  />
                </div>
                {errors.identifier && (
                  <p id="identifier-error" className="text-xs text-red-600 dark:text-red-400 animate-in slide-in-from-left-2 duration-200">
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                  Senha
                </Label>
                <div className="relative group">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={isLoading || isLocked}
                    className={`h-10 pl-10 pr-12 text-sm transition-all duration-200 ${
                      errors.password 
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200' 
                        : 'border-border focus:border-primary focus:ring-primary/20'
                    } ${
                      touched.password && !errors.password 
                        ? 'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-200' 
                        : ''
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent transition-all duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isLocked}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200" />
                    ) : (
                      <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-red-600 dark:text-red-400 animate-in slide-in-from-left-2 duration-200">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-10 text-sm font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Autenticando...</span>
                  </div>
                ) : isLocked ? (
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Bloqueado ({lockoutTime}s)</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Entrar</span>
                  </div>
                )}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-1">
        </div>
      </div>
    </div>
  );
}