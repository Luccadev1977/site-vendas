# Nexo Studio — arquitetura

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

`src/app`: páginas e APIs; `src/components`: interface pública, estúdio e painéis; `src/lib`: schemas, catálogo, auth e serviços; `supabase/migrations`: schema, políticas e catálogo inicial; `tests`: validação e integração SQL em PostgreSQL embarcado.

## Verificação

Testes PostgreSQL embarcados exercitam a migration real e papéis anon/authenticated com usuários distintos. Não substituem validação de Auth, Storage e SMTP no Supabase conectado. O roteiro de homologação externa está no README.
