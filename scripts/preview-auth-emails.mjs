import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, '.local-tools', 'email-preview');
await mkdir(destination, { recursive: true });
for (const name of ['confirmation', 'recovery']) {
  const template = await readFile(path.join(root, 'supabase/templates', `${name}.html`), 'utf8');
  // Offline fixtures only. No Auth request, account or email is created.
  const rendered = template
    .replaceAll('{{ .SiteURL }}', 'https://luccadev1977.github.io/site-vendas/')
    .replaceAll('{{ .RedirectTo }}', 'https://luccadev1977.github.io/site-vendas/conta/?callback=1')
    .replaceAll('{{ .TokenHash }}', '0'.repeat(64));
  const output = path.join(destination, `${name}.html`);
  await writeFile(output, rendered);
  console.log(`Prévia local com token fictício (não confirma uma conta): ${output}`);
}
