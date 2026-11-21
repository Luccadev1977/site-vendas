import { test, expect, type Page } from '@playwright/test';
// This suite deliberately writes only when an operator explicitly opts into a separate TEST project.
const enabled =
  process.env.E2E_ALLOW_TEST_PROJECT === 'true' &&
  Boolean(process.env.E2E_SUPABASE_URL) &&
  process.env.E2E_SUPABASE_URL === process.env.NEXT_PUBLIC_SUPABASE_URL;
const credentials = [
  'E2E_CLIENT_EMAIL',
  'E2E_CLIENT_PASSWORD',
  'E2E_OTHER_EMAIL',
  'E2E_OTHER_PASSWORD',
  'E2E_ADMIN_EMAIL',
  'E2E_ADMIN_PASSWORD',
];
async function login(page: Page, email: string, password: string, next: string) {
  await page.goto(`/conta?next=${encodeURIComponent(next)}`);
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page).toHaveURL(new RegExp(next.replaceAll('/', '\\/')));
}
test('connected commercial workflow, private receipt, manual confirmation and isolation', async ({
  browser,
  baseURL,
}) => {
  test.skip(
    !enabled || credentials.some((key) => !process.env[key]),
    'Requires an explicitly configured Supabase TEST project and three confirmed test accounts.',
  );
  const clientContext = await browser.newContext(),
    adminContext = await browser.newContext(),
    otherContext = await browser.newContext();
  const client = await clientContext.newPage(),
    admin = await adminContext.newPage(),
    other = await otherContext.newPage();
  try {
    await login(
      client,
      process.env.E2E_CLIENT_EMAIL!,
      process.env.E2E_CLIENT_PASSWORD!,
      '/modelos',
    );
    await client.goto('/studio/institucional-moderno');
    const name = `QA · ${Date.now()}`;
    await client.getByLabel('Nome da empresa', { exact: true }).fill(name);
    await client.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
    await expect(client.getByText('Rascunho salvo na sua conta.')).toBeVisible();
    await client.reload();
    await expect(client.getByLabel('Nome da empresa', { exact: true })).toHaveValue(name);
    await client.getByRole('button', { name: 'Enviar o pedido', exact: true }).click();
    await client.getByRole('button', { name: 'Continuar para os detalhes', exact: true }).click();
    const form = client.getByRole('dialog');
    await form.getByLabel('Nome completo', { exact: true }).fill('Cliente de homologação');
    await form.getByLabel('E-mail', { exact: true }).fill(process.env.E2E_CLIENT_EMAIL!);
    await form.getByLabel('WhatsApp', { exact: true }).fill('+55 11 99999-1234');
    await form.getByLabel('Prazo desejado', { exact: true }).fill('30 dias');
    await form
      .getByLabel('Finalidade do projeto', { exact: true })
      .fill('Homologar o fluxo comercial em ambiente de testes.');
    await form.getByRole('checkbox').check();
    await form.getByRole('button', { name: 'Enviar o pedido' }).click();
    const href = await client
      .getByRole('link', { name: 'Acompanhar meu projeto' })
      .getAttribute('href');
    expect(href).toBeTruthy();
    const id = href!.split('/').at(-1)!;
    await client.getByRole('link', { name: 'Acompanhar meu projeto' }).click();
    await expect(client.getByRole('heading', { name, exact: true })).toBeVisible();
    expect((await clientContext.request.get(`/api/pix/${id}`)).status()).toBe(403);
    await login(admin, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!, '/admin');
    await admin.goto('/admin/configuracoes');
    await admin.getByLabel('Chave Pix', { exact: true }).fill('pix-de-teste@example.test');
    await admin
      .getByLabel('Nome do beneficiário', { exact: true })
      .fill('Beneficiário de homologação');
    await admin.getByLabel('Banco', { exact: true }).fill('Banco de testes');
    await admin
      .getByLabel('Instruções de pagamento', { exact: true })
      .fill('AMBIENTE DE TESTES. Não transferir valores.');
    await admin.getByRole('button', { name: 'Salvar dados de pagamento' }).click();
    await expect(admin.getByText('Dados Pix atualizados.')).toBeVisible();
    await admin.goto(`/admin/pedidos/${id}`);
    await expect(admin.getByRole('heading', { name, exact: true })).toBeVisible();
    await admin
      .locator('summary')
      .filter({ hasText: 'Aceitar pedido e preparar proposta' })
      .click();
    await admin.getByLabel('Preço total (R$)', { exact: true }).fill('1500');
    await admin.getByLabel('Prazo estimado', { exact: true }).fill('20 dias úteis');
    await admin
      .getByLabel('Serviços incluídos', { exact: true })
      .fill('Site institucional com as seções aprovadas.');
    await admin.getByRole('button', { name: 'Enviar proposta ao cliente' }).click();
    await expect(admin.getByText('Proposta enviada ao cliente.')).toBeVisible();
    await client.reload();
    await client.getByRole('button', { name: 'Aprovar proposta', exact: true }).click();
    await expect(client.getByText('pix-de-teste@example.test', { exact: true })).toBeVisible();
    await client
      .locator('input[type=file]')
      .first()
      .setInputFiles({
        name: 'comprovante-QA.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.7\n% ARQUIVO DE TESTE — NAO E COMPROVANTE REAL\n%%EOF'),
      });
    await expect(
      client.getByText('Comprovante enviado. O pagamento aguarda verificação manual.'),
    ).toBeVisible();
    await expect(client.getByText('Em verificação', { exact: true })).toBeVisible();
    await login(other, process.env.E2E_OTHER_EMAIL!, process.env.E2E_OTHER_PASSWORD!, '/painel');
    expect((await otherContext.request.get(`/api/pix/${id}`)).status()).toBe(403);
    const forbidden = await otherContext.request.post('/api/commands', {
      headers: { Origin: baseURL! },
      data: { action: 'confirm_payment', payload: { id } },
    });
    expect(forbidden.status()).toBe(403);
    const fileHref = await client
      .getByRole('link')
      .filter({ hasText: 'comprovante-QA.pdf' })
      .first()
      .getAttribute('href');
    expect((await otherContext.request.get(fileHref!)).status()).toBe(404);
    await other.goto(`/painel/projetos/${id}`);
    await expect(other.getByRole('heading', { name: 'Vamos voltar ao caminho.' })).toBeVisible();
    await other.goto('/admin');
    await expect(other.getByRole('heading', { name: 'Vamos voltar ao caminho.' })).toBeVisible();
    await admin.reload();
    admin.once('dialog', (dialog) => dialog.accept());
    await admin.getByRole('button', { name: 'Confirmar recebimento no banco' }).click();
    await expect(admin.getByText('Pagamento confirmado manualmente.')).toBeVisible();
    for (const status of ['revision', 'completed', 'delivered']) {
      await admin.getByLabel('Atualizar andamento', { exact: true }).selectOption(status);
      await admin
        .getByLabel('Observação / motivo da decisão', { exact: true })
        .fill('Homologação do andamento.');
      await admin.getByRole('button', { name: 'Registrar atualização' }).click();
      await expect(admin.getByText('Alteração registrada.', { exact: true })).toBeVisible();
      await expect(
        admin
          .locator('.dashboard-header')
          .getByText(
            { revision: 'Em revisão', completed: 'Concluído', delivered: 'Entregue' }[
              status as 'revision'
            ],
            { exact: true },
          ),
      ).toBeVisible();
    }
    await client.reload();
    await expect(
      client.locator('.dashboard-header').getByText('Entregue', { exact: true }),
    ).toBeVisible();
    expect((await adminContext.request.get('/api/admin/export')).status()).toBe(200);
    expect((await clientContext.request.get('/api/admin/export')).status()).toBe(403);
  } finally {
    await clientContext.close();
    await adminContext.close();
    await otherContext.close();
  }
});
