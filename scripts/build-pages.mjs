import { cp, mkdir, readFile, writeFile, rm, lstat } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { loadEnvConfig } = createRequire(require.resolve('next/package.json'))('@next/env');
const root = fileURLToPath(new URL('../', import.meta.url));
loadEnvConfig(root, false);
const publicURL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
if (Boolean(publicURL) !== Boolean(publicKey))
  throw new Error('Configure as duas variáveis públicas do Supabase.');
if (publicURL) {
  const url = new URL(publicURL);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)
  )
    throw new Error('Use uma URL HTTPS e somente a chave sb_publishable_ do Supabase.');
}
const staging = path.join(root, '.pages-build'),
  output = path.join(root, 'out');
async function clearGenerated(target) {
  if (![staging, output].includes(path.resolve(target)))
    throw new Error('Unexpected generated directory');
  try {
    if ((await lstat(target)).isSymbolicLink())
      throw new Error('Refusing to remove a symbolic link');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await rm(target, { recursive: true, force: true });
}
await clearGenerated(staging);
await mkdir(path.join(staging, 'src/app'), { recursive: true });
for (const file of [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'next.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
])
  await cp(path.join(root, file), path.join(staging, file));
for (const dir of ['components', 'lib'])
  await cp(path.join(root, 'src', dir), path.join(staging, 'src', dir), { recursive: true });
await cp(path.join(root, 'public'), path.join(staging, 'public'), { recursive: true });
for (const file of [
  'layout.tsx',
  'globals.css',
  'showroom.css',
  'commerce.css',
  'auth.css',
  'not-found.tsx',
  'error.tsx',
  'loading.tsx',
  'icon.svg',
  'robots.ts',
  'sitemap.ts',
])
  await cp(path.join(root, 'src/app', file), path.join(staging, 'src/app', file));
for (const route of ['privacidade', 'termos'])
  await cp(path.join(root, 'src/app', route), path.join(staging, 'src/app', route), {
    recursive: true,
  });
for (const file of ['robots.ts', 'sitemap.ts']) {
  const destination = path.join(staging, 'src/app', file);
  await writeFile(
    destination,
    (await readFile(destination, 'utf8')) + "\nexport const dynamic = 'force-static';\n",
  );
}
const home = (await readFile(path.join(root, 'src/app/page.tsx'), 'utf8')).replace(
  "export const dynamic = 'force-dynamic';",
  '',
);
await writeFile(path.join(staging, 'src/app/page.tsx'), home);
await cp(path.join(root, 'pages-site/app'), path.join(staging, 'src/app'), { recursive: true });
await cp(path.join(root, 'pages-site/data.ts'), path.join(staging, 'src/lib/data.ts'));
await cp(
  path.join(root, 'docs/screenshots/homepage.jpg'),
  path.join(staging, 'public/social-preview.jpg'),
);
let layout = await readFile(path.join(staging, 'src/app/layout.tsx'), 'utf8');
layout = layout.replace(
  "images: ['/opengraph-image']",
  "images: ['/site-vendas/social-preview.jpg']",
);
await writeFile(path.join(staging, 'src/app/layout.tsx'), layout);
const env = {
  ...process.env,
  NEXT_PUBLIC_DEPLOY_TARGET: 'github-pages',
  NEXT_PUBLIC_SITE_URL: 'https://luccadev1977.github.io/site-vendas',
  NEXT_PUBLIC_SUPABASE_URL: publicURL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publicKey,
};
for (const name of [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'SMTP_PASSWORD',
  'CRON_SECRET',
])
  delete env[name];
console.log(
  'Building isolated GitHub Pages export. Server routes and proxy are excluded; original sources are unchanged.',
);
const code = await new Promise((resolve, reject) => {
  const child = spawn(
    process.execPath,
    [path.join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'],
    { cwd: staging, env, stdio: 'inherit' },
  );
  child.on('error', reject);
  child.on('exit', resolve);
});
if (code !== 0) process.exit(Number(code) || 1);
await clearGenerated(output);
await cp(path.join(staging, 'out'), output, { recursive: true });
await writeFile(path.join(output, '.nojekyll'), '');
let commit = process.env.GITHUB_SHA;
try {
  commit ||= execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  commit ||= 'unversioned';
}
await writeFile(
  path.join(output, 'deployment.json'),
  JSON.stringify(
    { target: 'github-pages', commit, builtAt: new Date().toISOString(), catalogTemplates: 42 },
    null,
    2,
  ) + '\n',
);
console.log(
  'GitHub Pages artifact ready in out/. Full backend build remains available through pnpm build.',
);
