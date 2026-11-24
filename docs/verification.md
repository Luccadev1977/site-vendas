# Registro de verificação

## Implantação SQL autorizada — 24/11/2026

O diagnóstico somente em leitura confirmou zero migrations, tabelas/funções da aplicação e buckets no projeto `dhgyfncmvwnlehfelsth`. A RPC `is_admin` retornava HTTP 404/PGRST202; `projects` e `site_settings`, 404/PGRST205. A função pública e sua implementação privada já estavam definidas na primeira migration. Não foi necessário modificar os cinco arquivos SQL.

Após aprovação explícita das cinco migrations, a CLI 3.2.0 aplicou somente esses arquivos, na ordem, preservando seus números de versão. O conector confirmou o histórico completo, 21 tabelas com RLS, 22 políticas e ausência de grants de escrita direta para navegador. As sete RPCs públicas são `SECURITY INVOKER`, com grants restritos; nenhuma implementação privilegiada usa `search_path` inseguro. Os dois buckets têm `public = false`, com leitura pública de imagens de catálogo por política. A conta Auth existente foi preservada e recebeu perfil/registro de cliente. Não foram criados pedidos ou pagamentos de teste em produção.

HTTP após a aplicação: `is_admin` e `projects` retornaram 401/42501 sem sessão, preservando a restrição de acesso. `site_settings` e `templates` retornaram 200; o catálogo contém 42 modelos ativos, três Premium e 13 categorias, mantendo os 42 modelos anteriores arquivados. As políticas remotas correspondem ao isolamento por titular/projeto e administrador. Após identificar a conta confirmada e obter uma segunda aprovação explícita, o bootstrap cadastrou somente o UUID autorizado; a consulta posterior confirmou exatamente um administrador. O UUID real não foi incluído nos arquivos versionados.

**Sessão real:** o proprietário concluiu o login no navegador integrado. Visão geral, pedidos, financeiro, catálogo, projetos realizados e configurações carregaram com os controles administrativos. Não foram salvos dados Pix/WhatsApp nem simulados pedidos/pagamentos nessa verificação. Uma tentativa inicial de autenticação rejeitada foi seguida pelo login bem-sucedido do proprietário, sem alteração de senha ou das verificações de segurança.

[Evidência do painel autenticado](screenshots/admin-supabase.jpg).

O DOM autenticado expôs 84 links de demonstração (42 atuais e 42 arquivados). A conferência contra o artefato identificou os 42 caminhos `legacy-…` ausentes. A correção usa os slugs originais preservados para as demonstrações arquivadas no Pages e oferece orientação para modelos ainda sem rota publicada. A versão com servidor conserva suas rotas dinâmicas e não oferece links públicos de modelos desativados.

67 testes locais passaram. O teste de isolamento agora comprova que as dez tabelas protegidas contêm registros antes de conferir que outro cliente recebe zero registros, somente o próprio perfil/cliente e nenhum objeto Storage do titular. Os novos testes cobrem ausência de promoção automática, administrador único, RPC administrativa, RLS em todas as tabelas e privacidade dos objetos internos. Lint, TypeScript, formatação e builds completo/Pages passaram. O verificador estático aprovou 776 arquivos, 42 demos, 42 estúdios e 3061 referências locais.

Advisors após implantação: quatro observações informativas de RLS sem política nos objetos privados (negação intencional), proteção de senhas vazadas desativada, índice ausente para a FK `project_reads.user_id` e índices ainda sem uso. Nenhum alerta foi contornado removendo proteção ou concedendo permissões adicionais. Edge Function `finalize-upload`, SMTP próprio e dados comerciais Pix/WhatsApp permanecem pendentes.

Data: 19/11/2026. Fluxo: visitante → catálogo → estúdio → APIs autenticadas → transações PostgreSQL → painéis de cliente e administrador.

## Evidências locais

- Repositório inicialmente vazio, sem arquivos existentes a preservar.
- Build de produção Next.js/Webpack executado com sucesso. O primeiro build Turbopack falhou ao inicializar subprocesso no isolamento Windows; os scripts usam Webpack.
- Lint e TypeScript executados sem erros.
- Auditoria das dependências de produção: zero vulnerabilidades conhecidas na consulta efetuada.
- 16 verificações HTTP aprovadas na compilação de produção local: páginas públicas, APIs privadas, rejeição de origem externa e cabeçalhos de segurança.
- Suíte Vitest: 38 testes aprovados de migration real, RLS, fluxo de propostas, pagamento, Storage, preservação do modelo escolhido, publicação autorizada e validações.
- Navegador real: homepage HTTP 200; filtros categoria/estilo de 42 modelos até um resultado; estúdio atualiza nome/título na prévia; troca de dispositivo preserva configuração; rascunho restaurado após recarregar; modo claro/escuro; modal exige conta antes de enviar; viewport de celular 390×844 sem transbordamento horizontal no estúdio.
- A homepage final também foi conferida em 390×844: largura de conteúdo de 375 px, sem excesso horizontal. A mudança de tipografia foi verificada no estilo calculado do título da prévia.
- Capturas locais da interface: `docs/screenshots/homepage.jpg` e `docs/screenshots/studio.jpg`.

Os testes SQL usam PostgreSQL embarcado com schemas mínimos de Auth/Storage. Eles verificam o código SQL e as permissões, mas não simulam nem atestam uma conexão Supabase hospedada.

## Cenários do briefing

| Cenário                                 | Verificação realizada                                                          | Pendente no serviço conectado                     |
| --------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| Escolher, personalizar, salvar e enviar | Catálogo/estúdio/rascunho no navegador; save/submit/idempotência em PostgreSQL | Sessão Auth, API → Supabase e uploads reais       |
| Pedido no administrador                 | Leitura administrativa de briefing/configuração em SQL                         | Visualização com sessão administrativa real       |
| Proposta comercial                      | Envio e validações transacionais em SQL                                        | Interface conectada e notificação por e-mail      |
| Aprovação e Pix                         | Antes da aprovação nega; depois libera somente ao titular                      | Interface com Pix cadastrado pelo operador        |
| Comprovante e confirmação               | Storage policies, registro, review e confirmação exclusiva do admin em SQL     | Storage gerenciado, download e conferência humana |
| Andamento até entrega                   | Transições completas e histórico em SQL                                        | Dois navegadores com sessões reais                |
| Isolamento entre clientes               | RLS, mensagens, configurações, histórico, arquivos e Pix                       | Repetir com tokens de duas contas no Supabase     |
| Bloqueio administrativo                 | Escritas diretas e RPCs negadas; metadados não concedem admin                  | Repetir via REST/API do ambiente implantado       |
| Desktop e celular                       | Inspeção e interação no navegador                                              | Homologar painéis com dados reais de teste        |
| Compilação e implantação                | Build, tipos, lint e documentação                                              | Projeto Supabase e implantação Vercel             |

## Roteiro de homologação externa

1. Crie um projeto Supabase exclusivo de testes; aplique as três migrations e rode `supabase db advisors --remote`.
2. Configure Auth, SMTP de acesso e links conforme README. Cadastre um cliente, confirme o e-mail em outro navegador, saia, recupere a senha e valide o novo acesso. Confira que a sessão anterior e os links expirados recebem tratamento adequado.
3. Crie um segundo cliente e a conta do operador. Inicialize o único administrador pelo SQL Editor. Confirme que nenhuma outra conta entra em `/admin`.
4. Rode a suíte `tests/e2e/live.spec.ts` com o opt-in documentado no README. Ela percorre o fluxo comercial com contas distintas e comprovante explicitamente de teste. Não usa transferência real.
5. Confira manualmente catálogo, filtros, estúdio, mensagens, anexos, financeiro e formulários em celular e desktop. Verifique a exportação CSV e os valores no banco.
6. Teste upload válido, extensão falsa, formato proibido, arquivo acima de 4 MiB, URL de arquivo de outro cliente e repetição do envio do pedido.
7. Antes de aprovar, chame `get_pix` como cliente: deve negar. Depois de aprovar, somente titular/admin podem consultar. Um comprovante deve manter o pagamento em verificação e a receita recebida zerada.
8. Confirme o pagamento manualmente **somente no ambiente de teste** e percorra revisão, conclusão e entrega. Verifique histórico e notificações de ambas as contas.
9. Configure o SMTP de notificações e o worker em teste. Inspecione entregas, erros e tentativas sem publicar dados privados nos e-mails.
10. Revise identificação do controlador, políticas, domínio, URLs autorizadas, backups e permissões antes de iniciar a operação comercial.

## Limite observado

O usuário informou que ainda criará o projeto Supabase. Não foram fornecidas credenciais nem provisionados banco hospedado, Auth, Storage, SMTP ou Vercel. Os cenários conectados não devem ser classificados como homologados até que esse roteiro seja executado.

## Atualização do showroom — 20/11/2026

Verificações executadas nesta atualização: 50 testes Vitest/PGlite; lint; TypeScript; build completo com APIs e painéis; build estático de 137 páginas, incluindo compatibilidade com links antigos; verificação dos 729 arquivos do artefato e de 2.933 referências locais. HTTP: as 42 demonstrações, os 42 estúdios e demais páginas públicas retornaram 200; o smoke da versão completa passou em 16 verificações de rotas, cabeçalhos, Origin e proteção das APIs.

No navegador, as 42 demonstrações renderizaram título, imagem local e aviso de conteúdo fictício. Foram exercitados: comparação de três Premium, filtros combinados, edição e persistência em restaurante/arquitetura/tecnologia, fontes calculadas, paleta, FAQ, desfazer/refazer, edição pela prévia, tela cheia e revisão. Em viewport de 390×844, o editor com ferramentas recolhidas não excedeu a largura disponível.

Um JSON de teste sem dados pessoais, com imagem WebP incluída, foi importado pelo campo **Ou colar projeto JSON**. A prévia mostrou a imagem como URL `blob`, recuperou a imagem e o projeto após recarregar e concluiu a exportação com imagens pela interface. A transferência de arquivos pelo seletor nativo da automação travou; a seleção por arquivo e sua confirmação visual não foram concluídas nesse teste. O roteiro manual continua sendo selecionar PNG/JPEG/WebP, conferir a prévia, confirmar, recarregar e exportar/importar em outro navegador. Não foram usados arquivos pessoais.

Os testes SQL cobrem a migração e a hierarquia dos preços; nenhum Supabase real foi configurado, nem executados testes conectados de Auth, Storage ou SMTP. Os specs E2E foram atualizados para os novos controles; a verificação de navegador desta entrega foi feita pela automação CUA, sem executar a suíte Playwright conectada.

## Atualização comercial estática — 21/11/2026 (pré-aplicação)

O projeto Supabase `dhgyfncmvwnlehfelsth` respondeu pela API pública e a autenticação administrativa da CLI foi confirmada. A CLI foi vinculada localmente ao projeto. A URL e chave publicável foram salvas em `.env.local` ignorado e nas Repository Variables do Actions. A consulta anônima a `templates`, `projects` e `site_settings` retornou PGRST205: tabelas ainda indisponíveis na Data API. **Nenhuma migration foi executada no projeto remoto nesta etapa: o proprietário solicitou revisão antes de alterar o banco.** O plano está em [Migrations para revisão](supabase-migrations.md).

Verificação local: 56 testes Vitest/PGlite aprovados, incluindo as cinco migrations reais, isolamento de clientes, restrição administrativa, cadastro de WhatsApp, tipo de chave Pix, consentimento, número único/idempotência, proposta/aprovação, Pix liberado somente na etapa correta, comprovante em revisão e confirmação exclusivamente manual. A nova fronteira de arquivos bloqueia `register_file`/funções privilegiadas para clientes e valida os bytes antes da finalização confiável. Deno verificou os tipos da Edge Function; lint, TypeScript, build completo Node e build Pages passaram. A exportação Pages gerou 144 páginas e 775 arquivos; o verificador conferiu 3.053 referências locais e ausência de APIs/arquivos privados no artefato.

### Navegador real

Foram navegadas homepage, catálogo, demo Oliva Atelier, estúdio Oliva Atelier, conta e entrada administrativa em todas as larguras abaixo, altura 844 px. Mediu-se `document.documentElement.scrollWidth` contra `clientWidth` após renderização. A diferença de 15 px entre viewport e área útil corresponde à barra vertical de rolagem do ambiente Windows.

| Viewport | Área útil | Maior largura do conteúdo nas seis páginas | Resultado              |
| -------- | --------- | ------------------------------------------ | ---------------------- |
| 320 px   | 305 px    | 305 px                                     | Sem excesso horizontal |
| 375 px   | 360 px    | 360 px                                     | Sem excesso horizontal |
| 390 px   | 375 px    | 375 px                                     | Sem excesso horizontal |
| 430 px   | 415 px    | 415 px                                     | Sem excesso horizontal |
| 768 px   | 753 px    | 753 px                                     | Sem excesso horizontal |
| 1024 px  | 1009 px   | 1009 px                                    | Sem excesso horizontal |

A primeira rodada revelou transbordamento dos anéis decorativos da homepage em 768/1024 px; a correção foi validada na segunda rodada completa. Também foram exercitados menu mobile (abrir/navegar/fechar), barra inferior do editor, painel expansível com oito ferramentas, revisão em modal com rolagem interna e bloqueio de envio anônimo com links de cadastro/login. Em 320 px, o modal coube na área útil e sua largura interna coincidiu com a largura de rolagem (279 px). A captura [personalizador no celular](screenshots/mobile-studio.jpg) registra a interface real. As demonstrações continuam explicitamente fictícias; o botão comercial utiliza o fluxo real.

### Limites desta etapa

Não foram executados pedidos, decisões, pagamentos, upload gerenciado, cadastro/recuperação por e-mail nem visualização de painéis com sessões reais no Supabase hospedado. A função `finalize-upload` ainda não foi publicada. Esses cenários aguardam a aprovação/aplicação do esquema e as contas confirmadas. A ausência das tabelas também produz erros 404 de Data API ao tentar carregar o contato público; a verificação de console do ambiente conectado só poderá ser concluída depois da aplicação. WhatsApp permanece sem número/desativado e Pix sem valores reais até o administrador configurá-los. Nenhuma service role foi enviada ao frontend, ao Actions ou ao Git. Não houve publicação desta atualização antes da revisão do banco.

### Envio autorizado ao GitHub — 21/11/2026

Após revisar as migrations, o proprietário autorizou versionar e publicar todas as alterações implementadas, mantendo a aplicação dos SQL no Supabase pendente de aprovação. O workflow publica somente a aplicação estática; não contém comandos de migration ou deploy de Edge Functions. As duas variáveis públicas do Supabase já estão configuradas como Repository Variables. A publicação do código e das páginas não significa que os fluxos comerciais no serviço hospedado foram homologados. O resultado do workflow e a correspondência do SHA em `deployment.json` devem ser conferidos antes de informar a conclusão da publicação. A rotina permanente de verificações, commit, push em `main` e confirmação remota foi registrada em `AGENTS.md`.

## Cadastro e confirmação — 24/11/2026

Foram corrigidos cadastro e recuperação para mínimo de 8 caracteres, confirmação de senha, mostrar/ocultar, requisitos ao digitar, reenvio com espera e mensagens seguras. A rota estática de conta agora trata autenticação sem consultar as tabelas comerciais e permanece montada ao validar o callback. A confirmação só é exibida após resposta de Auth com usuário confirmado e sessão; parâmetros como `confirmed=1` não são aceitos como prova.

**Serviço hospedado:** a configuração inicialmente lida tinha mínimo 6, Site URL em localhost e nenhum redirect autorizado. A CLI oficial aplicou somente mínimo 8, Site URL de produção e allowlist `/site-vendas/conta/**`, além dos endereços de desenvolvimento documentados. A comparação posterior da configuração parcial mostrou zero mudanças declaradas pendentes; Confirm email continua habilitado. Nenhuma migration, alteração de MFA, SMTP, limite ou confirmação artificial de usuário foi executada.

A publicação dos templates foi tentada e recusada com HTTP 400 / `entitlement_required` (`auth.email_templates`), porque o projeto gratuito usa o provedor padrão. O proprietário confirmou não ter domínio nem SMTP; os HTML e assuntos permanecem preparados em `supabase/templates/`, sem ativação remota. Não houve mudança de plano ou contratação. O roteiro de SMTP, DNS e templates está em [auth-email.md](auth-email.md).

**Testes:** 64 testes Vitest/PGlite aprovados. Os novos testes verificam mínimo de senha, igualdade, frases longas, e-mail, links reais construídos a partir do template com placeholders de teste, PKCE, recuperação, remoção de credenciais da URL, parâmetros ambíguos, respostas inválidas do Auth e ausência de informações internas nos erros. As respostas de sucesso/expiração desses testes unitários são fixtures explícitas; não representam entrega de e-mail em produção.

**Navegador real:** senha de 7 caracteres foi bloqueada com a mensagem solicitada; senhas divergentes também. Mostrar/ocultar alternou o tipo do campo e não existe `maxLength` no campo de senha. Os termos ficaram desmarcados durante os testes, e nenhuma conta foi criada. Um token hash inválido foi enviado pelo callback ao Supabase real: a página informou link inválido/expirado, removeu o token da URL e ofereceu um único botão de reenvio. Nenhum erro ou aviso de console foi capturado nessa verificação. Cadastro inspecionado em 320, 375, 390, 430, 768 e 1024 px, sem excesso horizontal; entradas mobile com fonte de 16 px. Recuperação também foi navegada. [Captura do cadastro mobile](screenshots/signup-mobile.jpg).

**Não homologado:** envio de cadastro válido ao provedor com recebimento na caixa postal, renderização no Gmail/Outlook real, validação de link válido recebido, login posterior, reenvio e recuperação com e-mail efetivamente entregue. Esses cenários aguardam SMTP/endereço real verificado e uma conta de teste controlada pelo proprietário. Não devem ser relatados como aprovados com base em build, fixtures ou configuração de template.
