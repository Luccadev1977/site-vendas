import type { NextConfig } from 'next';

const pages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'github-pages';
const config: NextConfig = {
  poweredByHeader: false,
  ...(pages
    ? {
        output: 'export',
        basePath: '/site-vendas',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '') +
              "; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co" +
              (process.env.NODE_ENV === 'development' ? ' ws://127.0.0.1:* ws://localhost:*' : '') +
              "; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};
// Custom response headers require a server; GitHub Pages supplies its HTTP headers.
if (pages) delete config.headers;
export default config;
