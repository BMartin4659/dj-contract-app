// FORCE VERCEL DEPLOYMENT REFRESH - 2025-01-31 20:20
// CRITICAL CACHE BUSTING: Wedding event form deployment fix
// Wedding events not working on main contract form - FORCE COMPLETE REBUILD
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force complete cache invalidation
  generateBuildId: () => {
    return `build-${Date.now()}`;
  },
  env: {
    // Fallback Google Maps API key if not set in environment
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC8PCjGiQZm9PQE5YeRjU8CgTmrHQdUFyc',
    // Force deployment timestamp
    DEPLOYMENT_TIMESTAMP: '20250131-2020',
    FORCE_REBUILD: 'true',
  },
  // Disable all caching mechanisms
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dj-contract-app.web.app',
      },
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
    domains: ['js.stripe.com'],
  },
  experimental: {
    optimizeCss: false,
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
  // Disable static page generation for error pages
  output: 'standalone',
  // Add custom webpack configuration to help with hydration errors
  webpack: (config, { dev, isServer }) => {
    // Force webpack to treat this as a completely new build
    config.cache = false;
    
    if (!isServer) {
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.DefinePlugin({
          // Disable strict hydration checks in development
          '__NEXT_STRICT_MODE': JSON.stringify(false),
          '__NEXT_REACT_ROOT': JSON.stringify(true),
          '__NEXT_SUPPRESS_HYDRATION_WARNING': JSON.stringify(true),
          // Force deployment marker
          '__DEPLOYMENT_TIMESTAMP': JSON.stringify('20250131-2020'),
          '__FORCE_REBUILD': JSON.stringify(true),
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;