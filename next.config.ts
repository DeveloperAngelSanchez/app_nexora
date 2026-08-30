import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  turbopack: {},
  // Allow LAN access from smartphone during development
  allowedDevOrigins: ['192.168.18.20', '192.168.1.1', 'localhost:3000', '127.0.0.1:3000'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ulehiagimlusqhoazgzs.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'tecnoofertas.pe',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withSerwist(nextConfig);
