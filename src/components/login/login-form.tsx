"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, User, Lock, AlertCircle, Loader2 } from "lucide-react";
import styles from "./login-form.module.css";

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

interface LoginCredentials {
  identifier: string;
  password: string;
}

export function LoginForm() {
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
      .replace(/[<>\"']/g, '')
      .replace(/\s+/g, ' ');
  };

  // Validação de email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação de CRECI
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
            general: "Credenciais inválidas. Verifique seu usuário e senha." 
          });
        }
        return;
      }

      setLoginAttempts(0);

    } catch (err) {
      console.error("Login error:", err);
      setErrors({ 
        general: "Erro de conexão. Verifique suas credenciais e tente novamente." 
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
    <div className={styles.formContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestão de Lotes</h1>
        <p className={styles.subtitle}>
          Gerencie seus lotes de forma eficiente e organizada. Acesse o sistema completo de gestão imobiliária.
        </p>
      </div>

      <form onSubmit={handleLogin} className={styles.form} noValidate>
        {/* General Error Alert */}
        {errors.general && (
          <div className={styles.errorAlert}>
            <AlertCircle className={styles.errorIcon} />
            <span className={styles.errorText}>{errors.general}</span>
          </div>
        )}

        {/* Username Field */}
        <div className={styles.fieldGroup}>
          <div className={styles.inputContainer}>
            <User className={styles.inputIcon} />
            <input
              ref={identifierRef}
              type="text"
              placeholder="Usuário"
              value={credentials.identifier}
              onChange={(e) => handleInputChange('identifier', e.target.value)}
              onBlur={() => handleBlur('identifier')}
              onKeyDown={(e) => handleKeyDown(e, passwordRef)}
              disabled={isLoading || isLocked}
              className={`${styles.input} ${errors.identifier ? styles.inputError : ''}`}
              aria-invalid={!!errors.identifier}
              aria-describedby={errors.identifier ? "identifier-error" : undefined}
            />
          </div>
          {errors.identifier && (
            <p id="identifier-error" className={styles.fieldError}>
              {errors.identifier}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className={styles.fieldGroup}>
          <div className={styles.inputContainer}>
            <Lock className={styles.inputIcon} />
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              disabled={isLoading || isLocked}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isLocked}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className={styles.toggleIcon} />
              ) : (
                <Eye className={styles.toggleIcon} />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className={styles.fieldError}>
              {errors.password}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className={styles.forgotPassword}>
          <a href="#" className={styles.forgotLink}>Esqueceu a senha?</a>
        </div>

        {/* Login Button */}
        <button 
          type="submit" 
          className={styles.loginButton}
          disabled={isLoading || isLocked}
        >
          {isLoading ? (
            <div className={styles.buttonContent}>
              <Loader2 className={styles.buttonIcon} />
              <span>Logging in...</span>
            </div>
          ) : isLocked ? (
            <div className={styles.buttonContent}>
              <AlertCircle className={styles.buttonIcon} />
              <span>Locked ({lockoutTime}s)</span>
            </div>
          ) : (
            "Login"
          )}
        </button>


      </form>
    </div>
  );
}
