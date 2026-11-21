<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Regra permanente de entrega do Nexo Studio

- Ao concluir qualquer tarefa de desenvolvimento, execute as verificações necessárias, crie um commit descritivo e envie as alterações apropriadas para `origin/main`, exclusivamente em `Luccadev1977/site-vendas`.
- Confirme que o commit chegou ao remoto e, quando houver publicação, acompanhe o workflow do GitHub Pages até seu resultado. Alterar apenas os arquivos locais não conclui a entrega.
- Preserve funcionalidades existentes e os 42 modelos, incluindo os três Premium. Resolva conflitos preservando alterações locais e remotas; nunca utilize `git push --force`.
- Não versione arquivos de ambiente com valores, tokens, senhas, chaves secretas ou credenciais privadas. Mantenha `.env.example` com placeholders apropriados.
- Não aplique migrations ao Supabase sem aprovação explícita do proprietário. Versionar os arquivos SQL não autoriza executá-los no banco.
- Utilize GitHub Pages para esta publicação, sem Vercel ou criação de outro repositório.
- Uma instrução explícita do usuário para não enviar determinada alteração prevalece sobre esta rotina.
