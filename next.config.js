/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // Disable cache for both server and client builds
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;