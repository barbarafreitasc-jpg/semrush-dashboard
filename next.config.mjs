/** @type {import('next').NextConfig} */
const nextConfig = {
  // Garante que variáveis de ambiente server-side nunca vazem pro cliente
  serverRuntimeConfig: {
    SEMRUSH_API_KEY: process.env.SEMRUSH_API_KEY,
  },
  publicRuntimeConfig: {
    REFRESH_INTERVAL: process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '300000',
  },
};

export default nextConfig;
