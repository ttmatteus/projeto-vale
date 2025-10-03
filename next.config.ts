import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* opções de configuração aqui */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Desativar recarregamento térmico do Next.js, tratado por nodemon
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Desativar substituição de módulo térmico do webpack
      config.watchOptions = {
        ignored: ['**/*'], // Ignorar todas as mudanças de arquivo
      };
    }
    return config;
  },
  eslint: {
    // Ignorar erros ESLint durante a construção
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
