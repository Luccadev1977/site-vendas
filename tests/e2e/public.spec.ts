import { test, expect } from '@playwright/test';
test('catalog filters lead to a navigable preview and preserve a local draft', async ({ page }) => {
  await page.goto('/modelos');
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('restaurantes');
  await page.getByRole('combobox', { name: 'Estilo', exact: true }).selectOption('elegante');
  await expect(page.getByText('1 modelo para explorar', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Visualizar demonstração Oliva Atelier' }).click();
  await page.getByRole('button', { name: 'Contato', exact: true }).click();
  await expect(page.getByLabel('Mensagem na demonstração')).toBeInViewport();
  await page.getByRole('link', { name: 'Personalizar este modelo' }).click();
  await page.getByLabel('Nome da empresa', { exact: true }).fill('Empresa QA local');
  await page.getByRole('tab', { name: 'Textos', exact: true }).click();
  await page.getByLabel('Título principal', { exact: true }).fill('Uma nova possibilidade.');
  await page.getByRole('button', { name: 'Celular', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Uma nova possibilidade.' })).toBeVisible();
  await expect(page.getByText('Salvo neste dispositivo', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nome da empresa', { exact: true })).toHaveValue('Empresa QA local');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Solicitar orçamento', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu projeto, em perspectiva.' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar para os detalhes', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar minha conta', exact: true })).toBeVisible();
});
test('protects server endpoints and redirects private pages without a session', async ({
  request,
  page,
  baseURL,
}) => {
  const foreign = await request.post('/api/commands', {
    headers: { Origin: 'https://other.example.test' },
    data: { action: 'settings', payload: {} },
  });
  expect(foreign.status()).toBe(403);
  const mutation = await request.post('/api/commands', {
    headers: { Origin: baseURL! },
    data: { action: 'read_notifications', payload: {} },
  });
  expect(mutation.status()).toBe(401);
  expect((await request.get('/api/admin/export')).status()).toBe(401);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/conta/);
});
