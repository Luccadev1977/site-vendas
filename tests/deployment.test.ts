import { describe, it, expect } from 'vitest';
import { assetPath, routeWithoutBasePath } from '../src/lib/deployment';
import { configSchema } from '../src/lib/validation';
import { templates, defaultConfig } from '../src/lib/catalog';
describe('GitHub Pages path isolation', () => {
  it('prefixes public images without duplicating the repository path', () => {
    expect(assetPath('/images/abstract.svg', '/site-vendas')).toBe(
      '/site-vendas/images/abstract.svg',
    );
    expect(assetPath('/site-vendas/images/abstract.svg', '/site-vendas')).toBe(
      '/site-vendas/images/abstract.svg',
    );
  });
  it('preserves full deployment URLs, external links and browser URLs', () => {
    for (const value of [
      '/images/abstract.svg',
      'https://example.test/image.png',
      'blob:local-image',
      'data:image/png;base64,AA',
      '//example.test/a',
    ])
      expect(assetPath(value, '')).toBe(value);
    expect(assetPath('https://example.test/a', '/site-vendas')).toBe('https://example.test/a');
  });
  it('normalizes route matching only within the actual base path', () => {
    expect(routeWithoutBasePath('/site-vendas/studio/teste/', '/site-vendas')).toBe(
      '/studio/teste/',
    );
    expect(routeWithoutBasePath('/site-vendas', '/site-vendas')).toBe('/');
    expect(routeWithoutBasePath('/site-vendas-outra/modelos', '/site-vendas')).toBe(
      '/site-vendas-outra/modelos',
    );
  });
  it('keeps every saved configuration valid and independent of the hosting prefix', () => {
    for (const template of templates) {
      const config = defaultConfig(template);
      expect(configSchema.safeParse(config).success).toBe(true);
      expect(config.heroImage).not.toContain('/site-vendas/');
      expect(assetPath(config.heroImage, '/site-vendas')).toMatch(/^\/site-vendas\/images\//);
    }
  });
});
