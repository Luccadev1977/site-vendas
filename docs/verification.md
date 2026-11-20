# Registro de verificação

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
