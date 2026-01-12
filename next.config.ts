import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora erros TypeScript durante o build
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    // Exclui a pasta supabase/functions do processo de build
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /supabase\/functions\/.*\.ts$/,
      loader: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;
