import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['newrelic', '@prisma/client', 'prisma'],
  // AI チャットのシステムプロンプトに使用する機能説明書をサーバ実行時に読み込めるよう含める
  outputFileTracingIncludes: {
    '/api/chat': ['./docs/機能説明書.md'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
  async headers() {
    // 開発モード（Turbopack）の React はデバッグ機能で eval() を必要とするため、
    // 開発時のみ script-src に 'unsafe-eval' を許可する。本番では付与しない。
    const isDev = process.env.NODE_ENV === 'development';
    const scriptSrc = `script-src 'self' 'unsafe-inline'${
      isDev ? " 'unsafe-eval'" : ''
    } https://www.youtube.com`;

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' https://randomuser.me https://*.supabase.co https://img.youtube.com data:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.youtube.com; worker-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
