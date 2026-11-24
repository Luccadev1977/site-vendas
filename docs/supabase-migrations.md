# Supabase — revisão e aplicação em 24/11/2026

Alvo exclusivo: projeto Supabase `dhgyfncmvwnlehfelsth`, Nexo Studio. URL e chave publicável já estão conectadas ao build local e às variáveis públicas do GitHub Actions. **O proprietário aprovou expressamente as cinco migrations em 24/11/2026. Elas foram aplicadas na ordem, com suas versões originais registradas no histórico remoto.** A aprovação não incluiu promoção administrativa nem publicação de Edge Function.

## Resultado da aplicação autorizada

- Histórico remoto: exatamente as cinco versões da tabela abaixo, sem reset ou reparo artificial de histórico.
- 21 tabelas com RLS e 22 políticas; os quatro objetos privados não concedem leitura/escrita direta a `PUBLIC`, `anon` ou `authenticated`.
- `private.is_admin()` e `public.is_admin()` presentes. As sete RPCs públicas usam `SECURITY INVOKER`; as operações reservadas ao serviço não são executáveis por clientes.
- 42 modelos ativos, incluindo três com `content.tier = premium`, 13 categorias ativas e 42 modelos originais arquivados. O campo `style` não identifica o nível comercial Premium.
- A conta Auth existente foi preservada e recebeu seu perfil/registro de cliente. Nenhum pedido, senha ou token de teste foi criado no serviço hospedado.
- Buckets `project-files` e `catalog-assets` com flag `public = false`; as políticas permitem leitura pública somente das imagens de catálogo.
- HTTP após aplicação: `is_admin` e `projects` passaram de 404 para **401/42501 sem sessão**, o bloqueio esperado; `site_settings` e catálogo ativo retornaram **200**, com 42 modelos no catálogo.
- Advisors: quatro avisos informativos de RLS sem política nas tabelas privadas são intencionais (negação de acesso direto). Proteção de senhas vazadas permanece desativada. Há um aviso informativo de índice para `project_reads.user_id` e índices ainda sem uso em banco recém-criado. Nenhuma alteração adicional foi aplicada para silenciar esses avisos.

Após a identificação da conta confirmada e uma segunda autorização explícita, foi executado o bootstrap administrativo em transação, somente para o UUID indicado pelo proprietário. A consulta posterior confirmou exatamente um administrador e correspondência com a conta aprovada. O SQL com o UUID real fica em arquivo local ignorado pelo Git; o bootstrap versionado mantém o placeholder. Não foram alteradas políticas nem promovidas outras contas.

O proprietário realizou o login na aba pública do navegador integrado. A sessão real carregou visão geral, pedidos, financeiro, catálogo, projetos realizados e configurações (Pix, WhatsApp e auditoria), sem erro de migration. Os valores zerados correspondem à ausência real de pedidos/pagamentos; não foram criados registros comerciais fictícios.

A navegação autenticada também revelou 42 links de demonstração dos modelos arquivados apontando para slugs `legacy-…` ausentes na exportação. O componente do catálogo foi ajustado para usar `content.originalSlug` nos modelos arquivados do Pages e conferir a existência da rota compilada. Modelos novos ainda não publicados exibem orientação em vez de link quebrado; na versão com servidor, modelos desativados não anunciam uma demonstração pública inacessível. IDs, snapshots, modelos e políticas foram preservados.

## Diagnóstico somente em leitura antes da aplicação — 24/11/2026

O conector Supabase confirmou o projeto `nexo-studio` ativo (`ACTIVE_HEALTHY`). O histórico retornou **zero migrations aplicadas**. A consulta direta a `pg_class`, `pg_proc` e `pg_policies` confirmou que não existem tabelas nem funções da aplicação nos schemas `public` e `private`, nem políticas da aplicação nesses schemas ou em `storage`. Não existem buckets ou Edge Functions publicados. O Auth já possui uma conta confirmada; seus dados e senha não serão alterados.

As consultas HTTP com a chave publicável reproduziram `404 PGRST202` em `/rest/v1/rpc/is_admin` e `404 PGRST205` em `/rest/v1/projects` e `/rest/v1/site_settings`. Esses erros de API não significam que a página estática `/admin/` esteja ausente no Pages.

**Causa:** a infraestrutura SQL está versionada, mas ainda não foi aplicada. A migration `20261119172527_core_platform.sql`, linhas 13–20, cria `private.is_admin()` e o wrapper `public.is_admin()`. Não é necessário inventar uma sexta migration nem remover a checagem administrativa do frontend. Criar apenas o wrapper não resolve as tabelas e funções das quais o painel depende.

O relatório de segurança não encontrou tabelas expostas sem RLS, pois elas ainda não existem. Apontou a proteção contra senhas vazadas desativada no Auth; sua ativação deve ser avaliada nas configurações/condições do projeto, separadamente desta implantação SQL. O relatório de saúde não apresentou alertas.

## Plano revisado e aprovado

Aplicar **somente os cinco arquivos da tabela abaixo, na ordem**, exclusivamente no projeto identificado acima, registrando o histórico correspondente. Antes da execução, conferir novamente o histórico e os objetos para detectar mudanças feitas após este diagnóstico. Se aparecerem objetos ou migrations incompatíveis, interromper e revisar o plano; não usar reset, reparo artificial de histórico ou sobrescrita.

Após uma segunda conferência do histórico/objetos e a autorização do proprietário, foi executado `pnpm exec supabase migration up --remote=dhgyfncmvwnlehfelsth --yes` (CLI 3.2.0). O comando aplicou somente os cinco arquivos revisados e manteve suas versões no histórico remoto. Não executar novamente como procedimento de reparo genérico.

Foram criadas 21 tabelas com RLS:

- Públicas (17): `profiles`, `clients`, `categories`, `templates`, `testimonials`, `projects`, `customizations`, `quotes`, `payments`, `messages`, `files`, `status_history`, `notifications`, `project_reads`, `audit_log`, `portfolio`, `site_settings`.
- Privadas (4): `administrator`, `settings`, `rate_limits`, `email_outbox`.

Também foram criadas as RPCs `is_admin`, `command`, `get_pix`, `save_portfolio`, `finalize_file`, `claim_emails` e `finish_email`, suas implementações privadas, os triggers de perfil/preços e os dois buckets. As três últimas RPCs são restritas ao papel de serviço; não serão chamadas com credenciais privilegiadas no navegador.

As migrations preservam o usuário existente e preenchem seu perfil/registro de cliente. Não contêm `DROP TABLE`, `TRUNCATE` ou `DELETE FROM`. A quarta altera a restrição de estilos e arquiva os modelos originais, preservando seus IDs/snapshots, para publicar os 42 atuais, incluindo três Premium. Não havia pedidos no estado inspecionado. A execução teve efeitos reais (DDL, catálogo e perfis) após autorização explícita.

**A aprovação dos cinco arquivos não autoriza promover administrador.** `private.administrator` começa vazia. Para liberar sua conta no `/admin`, será necessário identificar o UUID da conta confirmada e autorizar separadamente sua inclusão pelo procedimento em `supabase/bootstrap-admin.sql`. Não presumir que a única conta existente seja a do proprietário. Não enviar senha, token ou service role no chat.

## Revisão da autorização e RLS

`private.administrator` tem chave singleton com `CHECK(singleton)` e `user_id` único: comporta no máximo uma conta. A tabela tem RLS e não concede leitura/escrita direta ao navegador. `private.is_admin()` compara o UUID de `auth.uid()` com esse registro; ignora metadados editáveis do usuário. A função privada usa `SECURITY DEFINER` apenas para essa consulta protegida, com `search_path` vazio; o wrapper público é `SECURITY INVOKER`, executável apenas por `authenticated`.

Clientes veem seu próprio perfil e pedidos por `auth.uid()`. Propostas, pagamentos, personalizações, mensagens, arquivos e histórico usam a autorização do projeto; notificações e leituras usam o destinatário. O administrador designado tem acesso comercial para operar os pedidos. Anônimos consultam apenas catálogo/conteúdo autorizado/contato comercial. O contato WhatsApp é público por intenção, vazio e desativado inicialmente. O Pix fica em `private.settings` e só é retornado ao administrador ou ao titular após a aprovação da proposta, conforme o estado do pagamento.

As escritas comerciais diretas são revogadas. RPCs validam identidade, e-mail confirmado, titularidade e papel administrativo, com limites de uso e auditoria. `project-files` é privado e restringe leitura ao titular/administrador; um cliente não pode registrar bytes como confiáveis. A publicação da Edge Function `finalize-upload`, ainda pendente e separada do plano SQL, é necessária para finalizar anexos.

O isolamento é testado em PostgreSQL temporário com duas identidades de cliente e uma identidade administrativa de teste. Esses testes não equivalem à homologação da sessão real do proprietário no Supabase. Após autorização e aplicação, conferir novamente RLS/grants, RPCs, catálogo, HTTP e sessão real. Um cliente comum deve receber acesso negado ao painel mesmo após os 404 de schema serem resolvidos.

## Arquivos e ordem

| Ordem | SQL completo                                                                                      | Alterações                                                                                                                                                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | [20261119172527_core_platform.sql](../supabase/migrations/20261119172527_core_platform.sql)       | Schemas público/privado; perfis e clientes ligados ao Auth; catálogo; pedidos e personalizações; propostas; pagamentos; mensagens; arquivos; histórico; notificações; auditoria; Pix privado; único administrador; limites persistentes; fila de e-mails; bucket privado `project-files`. Ativa RLS, restringe permissões diretas, cria comandos transacionais e índices. |
| 2     | [20261119172528_initial_catalog.sql](../supabase/migrations/20261119172528_initial_catalog.sql)   | Semeia o catálogo original demonstrativo, sem clientes, pedidos ou pagamentos fictícios. A etapa 4 converte esse catálogo para o showroom atual.                                                                                                                                                                                                                          |
| 3     | [20261119175055_managed_content.sql](../supabase/migrations/20261119175055_managed_content.sql)   | Portfólio com autorização de divulgação, RPC administrativa, auditoria e bucket `catalog-assets` com leitura pública por política e escrita exclusiva do administrador.                                                                                                                                                                                                   |
| 4     | [20261120145745_showroom_catalog.sql](../supabase/migrations/20261120145745_showroom_catalog.sql) | Publica 42 modelos em 13 categorias, três Premium; permite estilo Elegante e preços-base validados. Arquiva as 42 definições originais por ID, conserva registros/snapshots e prefixa slugs antigos com `legacy-`. Preserva projetos e modelos personalizados do administrador.                                                                                           |
| 5     | [20261121171055_static_orders.sql](../supabase/migrations/20261121171055_static_orders.sql)       | WhatsApp inicialmente vazio/desativado, atualização só por administrador confirmado; tipo de chave Pix privado; dispatcher protegido; bloqueio de `register_file` no navegador; finalização de arquivos reservada à função confiável após validação de usuário e bytes.                                                                                                   |

## Acesso e fluxo resultantes

- Visitante: consulta somente catálogo/conteúdo autorizado e o contato comercial habilitado.
- Cliente confirmado: lê seus próprios pedidos, propostas, mensagens e arquivos. Envia por RPC validada, com consentimento obrigatório e número `NX-…` único/idempotente. Não escreve livremente nas tabelas.
- Administrador: a tabela privada singleton identifica uma única conta. Pode analisar, solicitar informações, recusar com motivo, enviar proposta/preço/prazo e confirmar recebimento manualmente. Metadados editáveis de cadastro não concedem esse acesso.
- Pix: sem leitura pública; titular só consulta após aprovar a proposta. Comprovante deixa pagamento em revisão; nenhuma função de upload o confirma.
- Arquivos: `project-files` permanece privado, até 4 MiB por arquivo, com titularidade e projeto verificados. URLs assinadas são temporárias. O frontend recebe somente chave publicável, nunca service role.

## Procedimento de implantação e pendências

1. Conferir projeto, histórico remoto e eventuais tabelas existentes. Aplicar somente migrations pendentes; não executar reset, apagar tabelas, substituir dados do cliente ou reaplicar arquivos manualmente já registrados. Verificar também que `project-files`, caso já exista, seja privado: a criação usa `ON CONFLICT DO NOTHING` e não corrige um bucket preexistente público. Interromper a aplicação diante dessa incompatibilidade até definir sua correção com o proprietário.
2. Aplicar na ordem e conferir tabelas, políticas, catálogo e RPCs. Executar advisors de segurança.
3. Publicar `finalize-upload` com JWT obrigatório, `getUser`, e-mail confirmado, autorização e inspeção de bytes. A credencial privilegiada fica somente no runtime Edge.
4. Configurar Site URL/callbacks de confirmação e recuperação para o Pages. Manter confirmação de e-mail ativa e logins anônimos desativados.
5. O proprietário cadastra sua própria senha e confirma o e-mail. **A promoção administrativa é separada:** revisar [bootstrap-admin.sql](../supabase/bootstrap-admin.sql), substituir o UUID sentinela pela conta confirmada e executar como proprietário. Não haverá senha padrão nem promoção automática de contas comuns.

Nenhum número WhatsApp nem dado Pix será inventado. O administrador os preenche depois. Não se altera senha de usuário, não se transfere dinheiro e não se confirma pagamento real durante a implantação.

## Verificação já realizada

Na revisão de 24/11, 67 testes locais passaram, incluindo as cinco migrations em PostgreSQL embarcado, RLS de dois clientes, bloqueio de mutações administrativas, unicidade/idempotência, Pix após aprovação, comprovante em revisão, grants da finalização confiável e validação de arquivos. Os novos testes verificam criação da RPC sem promoção, administrador singleton, tabelas privadas e RLS nas 21 tabelas. O teste de isolamento preenche as dez tabelas protegidas antes de conferir zero registros para outro cliente, além de perfis próprios e Storage. Lint, TypeScript e builds Node/Pages passaram. Deno foi verificado na entrega anterior; a função Edge não mudou. Esses testes não substituem homologação de Auth, Storage e SMTP no serviço hospedado; pedidos reais ainda não foram enviados ao projeto remoto.

A revisão adicional de 21/11/2026 aplicou os cinco arquivos somente em PostgreSQL temporário local, com registros preenchidos de pedidos, personalizações, propostas, pagamentos, mensagens, arquivos, histórico, notificações e leituras. A segunda identidade de cliente recebeu zero registros alheios, só pôde consultar o próprio perfil e teve dez tentativas de comandos contra projeto alheio negadas. As 21 tabelas têm RLS; não há função `SECURITY DEFINER` no schema público; as escritas diretas comerciais e a leitura das quatro tabelas privadas ficaram bloqueadas. Não há `DROP TABLE`, `TRUNCATE` ou `DELETE FROM` nos cinco arquivos. Os SQL originais não foram alterados nesta revisão.
