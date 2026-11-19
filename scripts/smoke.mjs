import assert from 'node:assert/strict';
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';
let checked = 0;
for (const path of [
  '/',
  '/modelos',
  '/demo/institucional-minimalista',
  '/demo/restaurantes-premium',
  '/studio/institucional-moderno',
  '/privacidade',
  '/termos',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image',
]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  checked++;
}
for (const path of [
  '/api/admin/export',
  '/api/files/20000000-0000-4000-8000-000000000001',
  '/api/pix/20000000-0000-4000-8000-000000000001',
]) {
  assert.equal((await fetch(base + path)).status, 401, path);
  checked++;
}
for (const [origin, status] of [
  ['https://foreign.example.test', 403],
  [base, 401],
]) {
  const response = await fetch(base + '/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ action: 'read_notifications', payload: {} }),
  });
  assert.equal(response.status, status, 'Mutation boundary');
  checked++;
}
assert.equal((await fetch(base + '/api/internal/email', { method: 'POST' })).status, 401);
checked++;
console.log(
  `${checked} HTTP checks passed: public routes, private APIs, Origin and security headers.`,
);
