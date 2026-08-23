import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN access from smartphone during development
  // Note: allowedDevOrigins is supported in Next.js 15+
  allowedDevOrigins: ['192.168.18.20', '192.168.1.1', 'localhost:3000', '127.0.0.1:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tecnoofertas.pe',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
