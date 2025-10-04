"use client";

import { LoginLayout } from "@/components/login/login-layout";
import { LoginForm } from "@/components/login/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <div className="min-h-screen relative">
      {/* Theme Toggle Button */}
      <div className="absolute top-2 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <LoginLayout>
        <LoginForm />
      </LoginLayout>
    </div>
  );
}