import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* opções de configuração aqui */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ativar recarregamento térmico do Next.js
  reactStrictMode: true,
  eslint: {
    // Ignorar erros ESLint durante a construção
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
