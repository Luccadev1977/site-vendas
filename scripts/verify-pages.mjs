import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { templates, seedTemplates, categories, isPremium } from '../src/lib/catalog.ts';
assert.equal(templates.length, 42, 'Catalog must contain exactly 42 entries');
assert.equal(categories.length, 13, 'Catalog must contain 13 categories');
assert.equal(
  seedTemplates.filter(isPremium).length,
  3,
  'Seed collection must contain exactly three Premium models',
);
assert.equal(new Set(templates.map((t) => t.slug)).size, 42, 'Catalog slugs must be unique');
const output = fileURLToPath(new URL('../out/', import.meta.url)),
  prefix = '/site-vendas';
async function exists(relative) {
  await access(path.join(output, relative));
}
for (const file of [
  'index.html',
  '404.html',
  '.nojekyll',
  'modelos/index.html',
  'sobre-a-versao/index.html',
  'conta/index.html',
  'painel/index.html',
  'admin/index.html',
  'deployment.json',
  'social-preview.jpg',
])
  await exists(file);
for (const template of templates)
  for (const route of ['demo', 'studio']) await exists(`${route}/${template.slug}/index.html`);
async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'Artifact must not contain symbolic links');
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(full)));
    else result.push(full);
  }
  return result;
}
const files = await walk(output);
let resources = 0;
for (const full of files) {
  const relative = path.relative(output, full).replaceAll('\\', '/');
  assert(
    !/^(api\/|auth\/|supabase\/|\.env|\.git\/)/.test(relative),
    `Server or private content in artifact: ${relative}`,
  );
  if (!full.endsWith('.html')) continue;
  const html = await readFile(full, 'utf8');
  assert(
    !/(?:src|href)="\/(?:_next|images)\//.test(html),
    `Unprefixed static asset in ${relative}`,
  );
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const value = match[1].replaceAll('&amp;', '&');
    if (!value.startsWith(prefix + '/')) continue;
    const local = decodeURIComponent(value.slice(prefix.length + 1).split(/[?#]/)[0]);
    if (!local || !path.extname(local)) continue;
    assert(!local.includes('..'), 'Unsafe local resource');
    await exists(local);
    resources++;
  }
}
const info = JSON.parse(await readFile(path.join(output, 'deployment.json'), 'utf8'));
assert.equal(info.target, 'github-pages');
assert.equal(info.catalogTemplates, 42);
if (process.env.GITHUB_SHA) assert.equal(info.commit, process.env.GITHUB_SHA);
console.log(
  `Pages verification passed: ${files.length} artifact files, ${templates.length} demos, ${templates.length} studios, ${resources} local resource references; no server routes or secret files.`,
);
