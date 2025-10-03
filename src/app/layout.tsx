import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CustomToaster } from "@/components/ui/custom-toaster";
import { ThemeProvider } from "next-themes";
import { AuthGuard } from "@/components/auth-guard";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestão de Lotes - Vale Empreendimentos",
  description: "Sistema completo para gestão de lotes, clientes e transações em Vale Empreendimentos",
  keywords: ["Vale Empreendimentos", "gestão de lotes", "transações", "clientes", "ativos"],
  authors: [{ name: "Vale Empreendimentos" }],
  openGraph: {
    title: "Sistema de Gestão de Lotes",
    description: "Sistema completo para gestão de lotes, clientes e transações em Vale Empreendimentos",
    url: "https://chat.z.ai",
    siteName: "Vale Empreendimentos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de Gestão de Lotes",
    description: "Sistema completo para gestão de lotes, clientes e transações em Vale Empreendimentos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            <AuthGuard>
              {children}
              <CustomToaster />
            </AuthGuard>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
