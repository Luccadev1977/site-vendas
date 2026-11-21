# Migrations para revisão — 21/11/2026

Alvo exclusivo: projeto Supabase `dhgyfncmvwnlehfelsth`, Nexo Studio. URL e chave publicável já estão conectadas ao build local e às variáveis públicas do GitHub Actions. A autenticação da CLI foi confirmada. **Este documento apresenta o plano; não registra execução no banco. A aplicação aguarda a revisão solicitada pelo proprietário.**

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

## Aplicação prevista após aprovação

1. Conferir projeto, histórico remoto e eventuais tabelas existentes. Aplicar somente migrations pendentes; não executar reset, apagar tabelas, substituir dados do cliente ou reaplicar arquivos manualmente já registrados. Verificar também que `project-files`, caso já exista, seja privado: a criação usa `ON CONFLICT DO NOTHING` e não corrige um bucket preexistente público. Interromper a aplicação diante dessa incompatibilidade até definir sua correção com o proprietário.
2. Aplicar na ordem e conferir tabelas, políticas, catálogo e RPCs. Executar advisors de segurança.
3. Publicar `finalize-upload` com JWT obrigatório, `getUser`, e-mail confirmado, autorização e inspeção de bytes. A credencial privilegiada fica somente no runtime Edge.
4. Configurar Site URL/callbacks de confirmação e recuperação para o Pages. Manter confirmação de e-mail ativa e logins anônimos desativados.
5. O proprietário cadastra sua própria senha e confirma o e-mail. **A promoção administrativa é separada:** revisar [bootstrap-admin.sql](../supabase/bootstrap-admin.sql), substituir o UUID sentinela pela conta confirmada e executar como proprietário. Não haverá senha padrão nem promoção automática de contas comuns.

Nenhum número WhatsApp nem dado Pix será inventado. O administrador os preenche depois. Não se altera senha de usuário, não se transfere dinheiro e não se confirma pagamento real durante a implantação.

## Verificação já realizada

56 testes locais passam, incluindo as cinco migrations em PostgreSQL embarcado, RLS de dois clientes, bloqueio de mutações administrativas, unicidade/idempotência, Pix após aprovação, comprovante em revisão, grants da finalização confiável e validação de arquivos. Lint, TypeScript, Deno e builds Node/Pages também passaram. Esses testes não substituem homologação de Auth, Storage e SMTP no serviço hospedado; pedidos reais ainda não foram enviados ao projeto remoto.

A revisão adicional de 21/11/2026 aplicou os cinco arquivos somente em PostgreSQL temporário local, com registros preenchidos de pedidos, personalizações, propostas, pagamentos, mensagens, arquivos, histórico, notificações e leituras. A segunda identidade de cliente recebeu zero registros alheios, só pôde consultar o próprio perfil e teve dez tentativas de comandos contra projeto alheio negadas. As 21 tabelas têm RLS; não há função `SECURITY DEFINER` no schema público; as escritas diretas comerciais e a leitura das quatro tabelas privadas ficaram bloqueadas. Não há `DROP TABLE`, `TRUNCATE` ou `DELETE FROM` nos cinco arquivos. Os SQL originais não foram alterados nesta revisão.
