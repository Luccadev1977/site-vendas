export const isGitHubPages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'github-pages';
export const publicBasePath = isGitHubPages ? '/site-vendas' : '';

/** Prefix the rendered URL; saved configurations stay portable to the full application. */
export function assetPath(path: string, basePath = publicBasePath): string {
  if (!basePath || !path.startsWith('/') || path.startsWith('//')) return path;
  if (path === basePath || path.startsWith(`${basePath}/`)) return path;
  return `${basePath}${path}`;
}
export function routeWithoutBasePath(path: string, basePath = publicBasePath): string {
  if (basePath && path === basePath) return '/';
  if (!basePath || !path.startsWith(`${basePath}/`)) return path;
  return path.slice(basePath.length);
}
