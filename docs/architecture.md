# Nexo Studio — arquitetura

## Publicação estática separada

O GitHub Pages utiliza `pnpm build:pages`, que gera uma árvore temporária `.pages-build/` a partir dos componentes compartilhados e das rotas em `pages-site/`, exportando somente arquivos públicos em `out/`. O build normal `pnpm build` mantém todas as rotas de servidor, autenticação, administração e Supabase. Veja [GitHub Pages](github-pages.md).

Repositório inicialmente vazio, inspecionado em 19/11/2026. Aplicação Next.js App Router, TypeScript, Tailwind, componentes React e Supabase (Postgres, Auth, Storage). Hospedagem compatível com Vercel.

## Limites de confiança

- Páginas públicas apresentam catálogo persistido no banco. Sem configuração externa, somente os modelos demonstrativos e o editor local ficam disponíveis; nenhum pedido é simulado.
- O editor usa uma configuração JSON versionada. Rascunho local funciona antes do cadastro; rascunho na conta e envio exigem sessão confirmada.
- Route Handlers validam origem, sessão e dados com Zod. Cliente Supabase usa a sessão do usuário, mantendo RLS. Não há service role nas operações comerciais.
- Tabelas comerciais têm RLS e somente leitura direta. Mutações passam por RPC transacional com verificação de titularidade, autorização, limites persistentes e máquina de estados. Implementação privilegiada fica no schema privado, com search_path fixo e EXECUTE revogado por padrão.
- Administrador é um UUID em tabela privada singleton, cadastrado somente pelo operador SQL. Metadados editáveis do usuário não concedem privilégios.
- Aprovação do orçamento libera leitura da configuração Pix por RPC que verifica o projeto. Comprovante não confirma pagamento. Somente administrador confirma, com histórico e auditoria.
- Storage privado, 4 MB por arquivo, JPEG/PNG/WebP/PDF. O limite cabe no payload de funções da Vercel. Arquivos são vinculados ao projeto; downloads conferem RLS e são servidos com cabeçalhos seguros. Prévia aceita somente imagens verificadas.
- Eventos criam notificações internas e outbox transacional. Worker SMTP opcional usa credencial secreta exclusivamente no servidor e reserva mensagens para evitar concorrência.

## Módulos

O showroom usa `catalog.ts` para 39 modelos convencionais e três Premium, `template-routes.ts` para links antigos e `showroom.css` para composições por nicho/estilo. O editor usa um reducer de histórico limitado a 80 alterações; imagens locais ficam no IndexedDB e nunca são aceitas pelo schema de comandos do servidor. A nova migration arquiva o catálogo original sem apagar seus IDs ou snapshots. Classificação e preços públicos ficam no `content` dos modelos, com validação de hierarquia no banco e exportação administrativa para o snapshot do Pages. Veja [showroom](showroom.md).

`src/app`: páginas e APIs; `src/components`: interface pública, estúdio e painéis; `src/lib`: schemas, catálogo, auth e serviços; `supabase/migrations`: schema, políticas e catálogo inicial; `tests`: validação e integração SQL em PostgreSQL embarcado.

## Verificação

Testes PostgreSQL embarcados exercitam a migration real e papéis anon/authenticated com usuários distintos. Não substituem validação de Auth, Storage e SMTP no Supabase conectado. O roteiro de homologação externa está no README.
