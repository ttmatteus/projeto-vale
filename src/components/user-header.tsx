"use client";

import { Home, LogOut, User, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

export function UserHeader() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  if (!isAuthenticated || !user) {
    return (
      <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Vale Empreendimentos</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" size="sm">
              <LogIn className="h-4 w-4 mr-2" />
              Entrar
            </Button>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-6">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Vale Empreendimentos</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <NotificationsDropdown />
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name || user.identifier}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email || user.identifier}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Meu Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem>Ajuda</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}