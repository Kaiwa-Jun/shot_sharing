/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["lh3.googleusercontent.com"], // Google認証用に追加
    unoptimized: true,
  },
  webpack: (config) => {
    // Disable cache for both server and client builds
    config.cache = false;
    return config;
  },
  output: "standalone",
};

module.exports = nextConfig;
