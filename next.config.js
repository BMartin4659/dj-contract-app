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
    domains: ['js.stripe.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'js.stripe.com',
        pathname: '/v3/fingerprinted/img/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/wikipedia/commons/**',
      }
    ],
  },
  experimental: {
    allowedDevOrigins: ['localhost', '127.0.0.1'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 