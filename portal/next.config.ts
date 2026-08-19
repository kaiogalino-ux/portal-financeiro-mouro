import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A Vercel empacota as funções serverless com o próprio rastreamento de
  // arquivos, que espera o formato de build padrão do Next.js — e falha com
  // ENOENT em next-server.js.nft.json quando encontra 'standalone' no lugar.
  // 'standalone' é para o outro caminho de publicação deste projeto, o
  // Dockerfile, que roda `node server.js` de forma autocontida (Render/VPS).
  // A Vercel expõe VERCEL=1 durante o build, então a escolha é automática.
  output: process.env.VERCEL ? undefined : 'standalone',
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
