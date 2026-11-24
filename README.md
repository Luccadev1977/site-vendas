# Nexo Studio

Plataforma de venda e personalização de sites construída do zero em Next.js App Router, TypeScript, Tailwind CSS, Lucide, Motion, React Hook Form, Zod e Supabase. Identidade provisória original, tema escuro/claro e experiência responsiva.

O objetivo é permitir que clientes escolham e personalizem uma direção visual, solicitem um orçamento e acompanhem a contratação e o desenvolvimento. O administrador centraliza propostas, comunicação, pagamentos por Pix e entregas em uma área privada.

**Código-fonte:** [Luccadev1977/site-vendas](https://github.com/Luccadev1977/site-vendas).

**Publicação estática:** [Nexo Studio no GitHub Pages](https://luccadev1977.github.io/site-vendas/). O catálogo e o estúdio local são publicados automaticamente pelo workflow em `.github/workflows/deploy.yml`. Consulte [a documentação do GitHub Pages](docs/github-pages.md) para os limites e a separação das compilações.

## Estado de configuração

A publicação no GitHub Pages usa Supabase Auth, Data API com RLS e Storage privado diretamente pelo navegador, somente com URL e chave publicável. Pedidos, propostas, mensagens, painéis e Pix funcionam nessa arquitetura depois de aplicar as migrations, configurar Auth e publicar a Edge Function `finalize-upload`. O Pages não executa APIs Next.js. A versão com servidor está preservada. Não existem pedidos, clientes, pagamentos ou números de atendimento simulados.

Foram executados testes SQL em PostgreSQL embarcado e testes de validação. A homologação integrada de Auth, Storage e SMTP no Supabase real continua pendente. Consulte [a evidência de verificação](docs/verification.md).

Em 24/11/2026, as cinco migrations foram aplicadas ao projeto oficial após aprovação do proprietário. O histórico, as 21 tabelas com RLS, os 42 modelos (três Premium), os buckets e as RPCs foram conferidos no serviço real. Os 404 de schema foram resolvidos; sem sessão, os recursos privados retornam acesso negado. Uma única conta administrativa foi designada após identificação e autorização separadas. O proprietário entrou no navegador integrado e as seis áreas administrativas carregaram. A Edge Function de anexos ainda precisa ser publicada. Consulte [o diagnóstico e a implantação](docs/supabase-migrations.md).

## Funcionalidades

- Homepage, benefícios, processo, FAQ, SEO, sitemap, robots, Open Graph, termos e privacidade.
- 13 categorias com três estilos convencionais (Minimalista, Moderno, Elegante): 39 modelos, mais Luxury Business, Digital Experience e Signature Commerce. Exatamente 42 itens, três classificados como Premium. Composições próprias por segmento e coleção, com conteúdo fictício identificado.
- Catálogo com miniaturas WebP locais, filtros por categoria/estilo/coleção, busca imediata, ordenação e comparação de até três modelos.
- Estúdio com oito ferramentas, seis cores, paletas, combinações tipográficas, edição de texto pela prévia, sete seções, funcionalidades solicitadas, desfazer/refazer, tela cheia, revisão e prévias desktop/tablet/celular.
- Rascunhos locais automáticos e imagens no IndexedDB com confirmação visual; exportação/importação JSON com imagens para outro dispositivo. Na versão com servidor, continuam disponíveis rascunhos na conta e uploads privados.
- Preços e classificação editáveis no painel administrativo. Valores ainda não definidos aparecem como “Sob consulta”. Preços-base Premium devem superar os convencionais configurados, com validação na interface e no banco. Veja [o showroom e os limites do Pages](docs/showroom.md).
- Solicitação validada com briefing completo, anexos privados, personalizações e número único. Repetir o envio do mesmo projeto não cria outro pedido.
- Cadastro, confirmação de e-mail, login, recuperação de senha e logout.
- Painel do cliente: projetos, rascunhos, propostas, pagamentos, arquivos, conversas e histórico.
- Administração privada: indicadores, pedidos, propostas, recusas, solicitações de informação, andamento, catálogo, imagens públicas, projetos realizados autorizados, depoimentos, Pix, financeiro e auditoria.
- Pix liberado somente depois da aprovação. Comprovante inicia verificação; recebimento só é confirmado por ação administrativa. Não existe integração bancária nem QR Code fictício.
- Notificações internas e outbox transacional para e-mail via SMTP configurável no backend.
- Relatórios CSV protegidos contra fórmulas, com leitura paginada para não truncar valores no limite padrão do Supabase.

## Executar localmente

Requisitos: Node.js 22+ e pnpm 11.25.0. Versões exatas e lockfile incluídos. Webpack foi escolhido nos scripts porque o Turbopack apresentou falha de inicialização de subprocesso no ambiente Windows isolado; o build Webpack passou.

```powershell
git clone https://github.com/Luccadev1977/site-vendas.git
cd site-vendas
pnpm install --frozen-lockfile
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
# Preencha as variáveis antes de habilitar o backend.
pnpm dev
```

Se você já está na pasta do projeto, comece pela instalação das dependências, sem repetir o clone. O arquivo `.env.local` deve permanecer somente na sua máquina.

Abra [a aplicação local](http://127.0.0.1:3000). Neste computador, se o comando `pnpm` não estiver no PATH, use `./scripts/pnpm.ps1` no lugar de `pnpm`; o script localiza o pnpm incluído no runtime Node do Codex.

```powershell
./scripts/pnpm.ps1 dev
```

## Criar e conectar o Supabase

1. Crie um projeto no [Dashboard do Supabase](https://supabase.com/dashboard). Escolha a região de acordo com a sua operação e defina uma senha forte para o banco.
2. Em **Project Settings → API**, copie a URL e a **publishable key**. Não coloque service role ou secret key em variável `NEXT_PUBLIC_`.
3. Preencha `.env.local`:

| Variável                               | Valor necessário                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | URL canônica. Local: `http://127.0.0.1:3000`. Produção: seu domínio HTTPS, sem barra final. |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL HTTPS do projeto Supabase.                                                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do mesmo projeto.                                                          |
| `PRIVACY_CONTACT_EMAIL`                | Canal de privacidade que você atende.                                                       |

4. Aplique as migrations **na ordem**. O CLI 3.2.0 está fixado no projeto; os comandos abaixo foram conferidos em sua ajuda:

```powershell
pnpm exec supabase login
pnpm exec supabase link SEU_PROJECT_REF
pnpm exec supabase migration up --remote
pnpm exec supabase db advisors --remote --type security --fail-on error
```

O CLI pede autenticação/confirmação do alvo remoto. Não coloque tokens ou a senha do banco na linha de comando nem no repositório. Se preferir o SQL Editor, execute integralmente estes arquivos, em ordem, em um projeto novo:

1. `supabase/migrations/20261119172527_core_platform.sql`
2. `supabase/migrations/20261119172528_initial_catalog.sql`
3. `supabase/migrations/20261119175055_managed_content.sql`
4. `supabase/migrations/20261120145745_showroom_catalog.sql`
5. `supabase/migrations/20261121171055_static_orders.sql`

**Não use os dois métodos no mesmo banco sem reconciliar o histórico de migrations.** Os testes locais aplicam esses mesmos arquivos em PostgreSQL, com schemas `auth` e `storage` mínimos para testar as políticas. O Storage e o Auth gerenciados precisam ser homologados no Supabase real.

5. Exponha somente o schema `public` na Data API. Mantenha `private` fora dos schemas expostos. As migrations concedem explicitamente as permissões e ativam RLS.
6. Os buckets `project-files` e `catalog-assets` são criados pelas migrations. `project-files` é privado. `catalog-assets` tem leitura pública por política para imagens demonstrativas; somente o administrador pode gravar. Ambos aceitam até 4 MiB por arquivo; PDFs só no bucket privado. Não torne o bucket de projetos público.
7. Reinicie `pnpm dev` após alterar variáveis públicas.

## Configurar autenticação e e-mails de acesso

No Supabase Authentication:

- Ative o provedor de e-mail e a confirmação de e-mail. **Desative logins anônimos.** Configure senha mínima de **8 caracteres** e as proteções e limites do serviço. Cadastro e recuperação pedem confirmação de senha e permitem mostrar/ocultar os campos, sem limite artificial de comprimento no frontend.
- Em URL Configuration, use Site URL `https://luccadev1977.github.io/site-vendas/` e autorize `https://luccadev1977.github.io/site-vendas/conta/**` para o callback estático (incluindo parâmetros). Para desenvolvimento Node, autorize `http://127.0.0.1:3000/conta/**` e `http://localhost:3000/conta/**`. Use projeto separado para testes.
- Configure SMTP próprio para os e-mails de autenticação. Os campos SMTP da aplicação abaixo são para notificações de projetos, não substituem o SMTP do Auth.
- Os templates personalizados prontos ficam em `supabase/templates/`. No plano Free, projetos criados desde 03/06/2026 não podem editá-los com o SMTP padrão; SMTP próprio permite a personalização sem mudar o plano. Em 24/11/2026, a leitura remota confirmou SMTP próprio desativado. A integração está preparada em `supabase/smtp.example.toml` e `supabase/smtp.env.example`, sem credenciais, com prévias por `pnpm email:preview`. Domínio/remetente verificados, ativação e homologação de entrega continuam pendentes. A confirmação permanece exigida. Consulte [limitações, configuração e estado real](docs/auth-email.md).
- Após habilitar SMTP, configure links por token hash no fragmento. A aplicação envia `.RedirectTo` apontando para `/conta/`; o callback client-side remove o token da URL e só confirma após resposta válida do Supabase.

Confirmação de cadastro:

```html
<a href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=email">CONFIRMAR MINHA CONTA</a>
```

Recuperação:

```html
<a href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=recovery">Redefinir minha senha</a>
```

A rota também aceita o callback PKCE com `code`. O destino é validado como caminho local para impedir redirecionamentos externos. Verifique cadastro e recuperação em outro navegador/dispositivo durante a homologação. Referências: [SSR Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [templates de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates).

## Inicializar a única conta administrativa

1. Cadastre sua própria conta pela aplicação e confirme o e-mail.
2. Em Authentication → Users, copie o UUID dessa conta.
3. Abra `supabase/bootstrap-admin.sql`, substitua o UUID sentinela pelo seu UUID e execute no SQL Editor como proprietário do projeto.
4. Entre novamente em `/site-vendas/admin/`. Cadastre tipo de chave, chave, beneficiário, banco e instruções em **Configurações → Pagamentos → Pix**. Configure seu WhatsApp comercial na mesma tela, com 55 e sem símbolos, e ative o botão. O número inicial é vazio e o botão fica desativado.

Não há conta administrativa automática, senha padrão nem autorização baseada em `user_metadata`. A tabela `private.administrator` permite exatamente uma conta. A inicialização falha se já existir administrador. Para uma transferência de administração, o operador deve verificar a nova conta e alterar essa tabela pelo SQL Editor; não há endpoint público para isso.

## Fluxo de operação

O cliente escolhe um modelo, personaliza e salva. O envio congela o briefing e a configuração no projeto. O administrador analisa, solicita informações, recusa ou envia proposta com valor em centavos, escopo, condições e prazo. O cliente aprova ou recusa. A aprovação cria o pagamento pendente e autoriza a consulta do Pix; sem chave cadastrada, o cliente recebe orientação para falar com o estúdio.

Enviar comprovante muda o pagamento para `review`, nunca para confirmado. Somente após conferir o recebimento no banco, o administrador usa **Confirmar recebimento no banco**. A partir daí o projeto pode passar por desenvolvimento, revisão, conclusão e entrega. As transições são verificadas dentro de uma transação SQL e registradas no histórico. O fluxo inicial controla um pagamento integral por proposta aprovada; parcelamento e conciliação bancária não estão implementados.

## Notificações por e-mail (opcional)

Notificações internas funcionam com o banco. Eventos também entram em `private.email_outbox`, sem expor comprovantes, chave Pix ou briefing por e-mail.

| Variável somente no servidor | Uso                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_SERVICE_ROLE_KEY`  | Worker de e-mails, somente no servidor. A Edge Function usa a credencial injetada pelo Supabase após verificar usuário e bytes do arquivo. |
| `SMTP_HOST`, `SMTP_PORT`     | Provedor e porta SMTP.                                                                                                                     |
| `SMTP_SECURE`                | `true` para TLS direto; `false` para STARTTLS obrigatório.                                                                                 |
| `SMTP_USER`, `SMTP_PASSWORD` | Credenciais do provedor.                                                                                                                   |
| `MAIL_FROM`                  | Remetente verificado no provedor.                                                                                                          |
| `CRON_SECRET`                | Segredo aleatório forte para autorizar o worker.                                                                                           |

Um agendador de backend deve chamar `POST /api/internal/email` com `Authorization: Bearer <CRON_SECRET>`. O agendador **não foi provisionado**. Cada execução reserva até cinco e-mails por dez minutos, com até cinco tentativas e `SKIP LOCKED` para concorrência. Erros não registram credenciais. A entrega é ao menos uma vez: uma interrupção depois do aceite pelo SMTP pode exigir reconciliação para evitar e-mail repetido. Use um provedor com política de idempotência se precisar dessa garantia adicional.

Não invoque esse endpoint em produção com dados fictícios. Configure e homologue primeiro em um projeto de teste. Verifique a fila e os logs do provedor para falhas definitivas; novas tentativas após o limite exigem intervenção do operador.

## Segurança

- No Pages, sessão PKCE persistida pelo SDK, verificada com `getUser`, renovação automática e logout; RLS/RPC autorizam cada operação. Na versão Node, cookies SSR e proxy de renovação continuam disponíveis. Links de confirmação/recuperação são removidos da URL após leitura.
- RLS em todas as tabelas públicas e privadas. Acesso de leitura por titularidade ou administrador.
- Sem permissões diretas de `INSERT`, `UPDATE` ou `DELETE` nas tabelas comerciais para usuários. RPCs com validação no banco protegem também chamadas diretas à Data API.
- Implementações privilegiadas em schema privado, `search_path` fixo, `EXECUTE` restrito e verificações explícitas de identidade/titularidade.
- Bloqueio transacional por projeto, índices únicos e envio idempotente. Limites persistentes de 60 ações por minuto, 10 pedidos por 24 horas e 20 rascunhos por cliente.
- Até 50 arquivos registrados por projeto, quota de objetos e 4 MiB por arquivo. Assinatura binária conferida no servidor; SVG/HTML e executáveis não são aceitos em uploads.
- Arquivos privados não são sobrescritos nem removidos por clientes após registro. Download com sessão, RLS, `nosniff` e `Content-Disposition`. Comprovantes não usam URLs públicas.
- Validação Zod, limites de corpo, verificação de Origin, conteúdo React escapado e CSP. Não há HTML arbitrário do cliente.
- Sessões e APIs privadas com `no-store`. Nunca compartilhar cache de páginas autenticadas.
- Auditoria registra decisões administrativas e alterações de configurações, sem copiar a chave Pix para o log.

O limitador SQL protege mutações aceitas. Proteção contra ataques de rede e tentativas inválidas em grande volume deve ser configurada no provedor de hospedagem e nos limites do Supabase Auth. Para exclusão de dados, o operador deve atender o titular e cumprir retenção contratual/legal; não há exclusão de conta automatizada nesta versão.

## Testes e build

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
```

Os testes Vitest executam a migration real em PGlite, que é PostgreSQL embarcado, incluindo RLS com papéis `anon`/`authenticated`, duas contas de clientes, administrador e conta sem confirmação. Não utilizam respostas comerciais mockadas.

Os testes de navegador reutilizáveis estão em `tests/e2e`. Para executá-los após iniciar o servidor:

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
```

A suíte conectada `live.spec.ts` fica desabilitada por padrão. Ela exige um **projeto Supabase separado de teste**, as migrations, a conta administrativa inicializada e três contas de teste confirmadas. Configure no ambiente do processo de testes:

```text
E2E_ALLOW_TEST_PROJECT=true
E2E_SUPABASE_URL=<mesma URL de NEXT_PUBLIC_SUPABASE_URL do servidor de testes>
E2E_BASE_URL=http://127.0.0.1:3000
E2E_CLIENT_EMAIL=<cliente de teste>
E2E_CLIENT_PASSWORD=<senha de teste>
E2E_OTHER_EMAIL=<segundo cliente de teste>
E2E_OTHER_PASSWORD=<senha de teste>
E2E_ADMIN_EMAIL=<admin de teste>
E2E_ADMIN_PASSWORD=<senha de teste>
```

Não salve essas credenciais no Git nem use contas reais. O teste altera o Pix do projeto de teste, cria registros com prefixo QA e testa confirmação manual sem transferência real. Os registros são preservados para inspeção; não há limpeza destrutiva automática. Cadastro, confirmação e recuperação por SMTP exigem ainda o roteiro manual em `docs/verification.md`.

## Publicar no GitHub Pages

O destino desta publicação é o GitHub Pages. Em **Settings → Pages → Source**, utilize **GitHub Actions**. Cada push em `main` aciona o workflow de instalação, lint, testes, exportação estática e publicação. Configure em **Settings → Secrets and variables → Actions → Variables** as duas variáveis públicas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Somente chaves `sb_publishable_` são aceitas pelo build Pages; não adicione service_role ou secret key. Sem ambas, o showroom continua disponível e o envio fica desabilitado.

```powershell
pnpm build:pages
node scripts/verify-pages.mjs
```

O artefato publicável fica em `out/`, com os recursos sob `/site-vendas`. As APIs Next.js ficam fora do artefato. As rotas estáticas de conta e painéis usam Supabase com RLS; detalhes de pedidos usam `/painel/projeto/?id=UUID` e `/admin/pedido/?id=UUID`. **Enviar o pedido** valida briefing e consentimento e executa transação SQL idempotente; só a resposta do banco com número único produz confirmação. JSON continua disponível para exportar/importar a personalização, sem substituir o envio. Veja [os detalhes e a configuração](docs/github-pages.md).

## Versão completa com backend, preservada para uso futuro

O comando `pnpm build` continua compilando a aplicação com servidor. Para executá-la em um ambiente Node.js, configure Supabase e as variáveis documentadas e use `pnpm start`. Essa versão precisa de uma hospedagem com processamento no servidor; ela não é o artefato enviado ao GitHub Pages.

### Configuração futura do servidor

1. Prepare um ambiente Node.js 24.x, instale as dependências com `pnpm install --frozen-lockfile` e compile com `pnpm build`.
2. Execute `pnpm start` atrás de um proxy HTTPS configurado para o seu domínio. O processo deve permanecer ativo; não se trata de hospedagem estática.
3. Cadastre as variáveis obrigatórias em cada ambiente, usando outro projeto Supabase para testes. Segredos SMTP/worker permanecem sem prefixo `NEXT_PUBLIC_`.
4. Configure domínio HTTPS e ajuste `NEXT_PUBLIC_SITE_URL`, Site URL e Redirect URLs do Supabase. Refaça o build ao alterar variáveis públicas.
5. Aplique migrations no projeto correto antes do primeiro acesso comercial. Rode os advisors, os testes conectados e o roteiro de homologação.
6. Configure envio de e-mails e backups conforme sua operação; não foram criados serviços externos nesta entrega.

Os uploads da versão completa têm limite de 4 MiB. Imagens públicas do portfólio usam `next/image`; imagens privadas da prévia usam a rota autenticada, pois o otimizador não recebe a sessão do cliente. No Pages, IDs canônicos são resolvidos em URLs assinadas de curta duração via RLS, sem depender dessas APIs.

## Antes da operação comercial

Substitua Nexo Studio pela sua marca, informe a identificação do responsável, endereço/canais de atendimento, política concreta de retenção e canal de privacidade. Revise os termos, a política e as condições contratuais conforme sua operação. Publique projetos e depoimentos somente com autorização. A estrutura facilita o tratamento de dados e direitos previstos na LGPD; a conformidade depende também dos processos do controlador. Referência: [orientações da ANPD sobre direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares).

## Organização

```text
src/app/             Páginas públicas, conta, cliente, admin e APIs
src/components/      Componentes visuais, estúdio e painéis
src/lib/             Domínio, validação, autenticação e acesso aos dados
supabase/migrations/ Schema, políticas, funções e catálogo inicial
supabase/bootstrap-admin.sql Inicialização manual segura do administrador
tests/               Integração PostgreSQL, validação e E2E opt-in
docs/                Arquitetura e evidências de verificação
```

## Arquivos privados e função confiável

Publique a função depois das migrations:

```powershell
pnpm exec supabase functions deploy finalize-upload --remote=SEU_PROJECT_REF --use-api
```

A função exige JWT de usuário (`verify_jwt=true`), e-mail confirmado, titularidade e inspeção real de bytes (PNG/JPEG/WebP/PDF, até 4 MiB). `register_file` não pode ser chamado diretamente pelo navegador; somente a função confiável executa `finalize_file`. O upload de comprovante produz revisão, nunca pagamento confirmado. Imagens públicas de catálogo exigem administrador. A service role é injetada pelo runtime Edge e nunca entra no GitHub Actions/Pages. `APP_ORIGINS` permite por padrão somente `https://luccadev1977.github.io`; para homologação local, configure explicitamente origens adicionais no ambiente Edge.

As notificações internas estão no banco. E-mails comerciais exigem o worker/SMTP opcional descrito acima, que não é executado pelo Pages. A chave Pix fica no schema privado; apenas administrador e titular com proposta aprovada podem consultá-la. Não publique Pix no snapshot público de catálogo.

O plano das cinco migrations, permissões e impacto está em [Migrations para revisão](docs/supabase-migrations.md). A aplicação no projeto remoto aguarda a revisão solicitada pelo proprietário.
