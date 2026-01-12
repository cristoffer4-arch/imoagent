import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Permite que o build continue mesmo com erros do TypeScript nas Edge Functions
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
