// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Разрешаем туннелю ngrok подключаться к серверу горячей перезагрузки Next.js 16
  allowedDevOrigins: [
    'grafted-deport-gerbil.ngrok-free.dev',
    '*.ngrok-free.dev'
  ]
};

export default nextConfig;
