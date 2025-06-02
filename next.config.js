// Cache-busting comment - last updated: 2025-01-31 15:30
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    // Fallback Google Maps API key if not set in environment
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC8PCjGiQZm9PQE5YeRjU8CgTmrHQdUFyc',
  },
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
    optimizeCss: false
  },
  compiler: {
    // Enables the styled-components SWC transform
    styledComponents: true,
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
  // Add custom webpack configuration to help with hydration errors
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.DefinePlugin({
          // Disable strict hydration checks in development
          '__NEXT_STRICT_MODE': JSON.stringify(false),
          '__NEXT_REACT_ROOT': JSON.stringify(true),
          '__NEXT_SUPPRESS_HYDRATION_WARNING': JSON.stringify(true),
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig; 