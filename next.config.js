/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dj-contract-app.web.app',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: ['localhost', '127.0.0.1'],
  },
};

module.exports = nextConfig; 