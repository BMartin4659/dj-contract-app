// FORCE VERCEL DEPLOYMENT REFRESH - 2025-02-01 14:30
// CRITICAL FIX: Google Maps API and CSS background scrolling for Vercel
// Background scrolling and Google autocomplete not working on Vercel - FORCE COMPLETE REBUILD
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Force complete cache invalidation
  generateBuildId: () => {
    return `vercel-fix-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },
  env: {
    // Ensure Google Maps API key is available in production
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc',
    // Force deployment timestamp
    DEPLOYMENT_TIMESTAMP: '20250201-1430',
    FORCE_REBUILD: 'true',
    VERCEL_DEPLOYMENT: 'true',
  },
  // Production-specific configuration for Vercel
  publicRuntimeConfig: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc',
  },
  // Disable all caching mechanisms for CSS and JS
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
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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
    allowedDevOrigins: ['localhost', '127.0.0.1'],
    // Disable CSS optimization that might interfere with background fix
    optimizeCss: false,
    esmExternals: false,
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
  // Add custom webpack configuration for production fixes
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
          '__DEPLOYMENT_TIMESTAMP': JSON.stringify('20250201-1430'),
          '__FORCE_REBUILD': JSON.stringify(true),
          '__VERCEL_DEPLOYMENT': JSON.stringify(true),
          // Expose Google Maps API key to client
          '__GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC-5o9YY4NS8y8F2ZTg8-zibHYRP_1dOEc'),
        })
      );
      
      // Ensure CSS is processed correctly in production
      if (!dev) {
        config.optimization.splitChunks.cacheGroups.styles = {
          name: 'styles',
          test: /\.(css|scss|sass)$/,
          chunks: 'all',
          enforce: true,
        };
      }
    }
    return config;
  },
};

module.exports = nextConfig; 