/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    // Configure allowed development origins to support cross-origin requests during development
    experimental: {
      allowedDevOrigins: [
        '192.168.254.98', // IP address from the warning
        'localhost',
        '127.0.0.1'
      ],
    },
  };
  
  export default nextConfig;
  