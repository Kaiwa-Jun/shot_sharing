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
  },
  // 環境変数を設定して、サーバーサイドとクライアントサイドのレンダリングを区別
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || "development",
    NEXT_PUBLIC_SITE_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  },
};

module.exports = nextConfig;
