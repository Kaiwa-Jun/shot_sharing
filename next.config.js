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
  // すべてのページを動的にレンダリングするように設定
  staticPageGenerationTimeout: 1000,
  // 静的エクスポートを無効にして、すべてのページをサーバーサイドレンダリングする
  experimental: {
    // SSRのみを使用するように設定
    disableOptimizedLoading: true,
    // appDirのページをすべて動的レンダリングに設定
    appDir: true,
  },
};

module.exports = nextConfig;
