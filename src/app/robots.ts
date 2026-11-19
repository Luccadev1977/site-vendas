import type { MetadataRoute } from 'next';
import { publicBasePath } from '@/lib/deployment';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: `${publicBasePath}/`,
      disallow: ['/admin', '/painel', '/studio', '/conta', '/api', '/auth', '/demo'].map(
        (path) => publicBasePath + path,
      ),
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}
