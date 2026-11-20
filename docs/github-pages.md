# Publicação no GitHub Pages

Endereço: https://luccadev1977.github.io/site-vendas/

O workflow `.github/workflows/deploy.yml` executa em cada push na branch `main` e também aceita execução manual. Instala dependências pelo lockfile, executa lint e testes, compila a exportação estática, verifica suas rotas e recursos, envia o artefato e publica no ambiente `github-pages`.

## Duas compilações, fontes preservadas

| Comando            | Resultado | Uso                                                              |
| ------------------ | --------- | ---------------------------------------------------------------- |
| `pnpm build`       | `.next/`  | Plataforma completa, com servidor Node.js e Supabase configurado |
| `pnpm build:pages` | `out/`    | HTML, CSS, JavaScript e imagens para GitHub Pages                |

`build:pages` prepara uma árvore gerada em `.pages-build/`, reutilizando componentes e estilos. As variantes de rotas ficam versionadas em `pages-site/`. O script não renomeia, remove ou altera as rotas originais de `src/app`, nem as migrations ou a integração com Supabase. As pastas geradas são ignoradas pelo Git.

Na compilação Pages, `NEXT_PUBLIC_DEPLOY_TARGET=github-pages` ativa `output: 'export'`, `basePath: '/site-vendas'`, `trailingSlash: true` e imagens sem otimizador de servidor. Os links Next.js recebem o prefixo automaticamente; imagens diretas usam `assetPath` somente na renderização. Configurações salvas e exportadas permanecem portáveis.

## Recursos publicados

- Homepage, catálogo com filtros, 42 demonstrações navegáveis e 42 estúdios pré-gerados.
- 39 modelos convencionais em 13 categorias e três Premium, com busca, filtros, ordenação e comparação de até três modelos.
- Oito ferramentas, seis cores, paletas, tipografia, imagens locais, sete seções, desfazer/refazer, revisão e prévia desktop/tablet/celular.
- Rascunho no dispositivo e exportação/importação JSON da configuração com imagens, além da exportação da solicitação preenchida.
- Termos, privacidade, informações sobre esta versão e página 404.

GitHub Pages não executa um servidor Node.js. APIs `POST`, cookies de autenticação SSR, proxy, uploads privados, pedidos no banco, mensagens, propostas, Pix e administração não são executados por esta publicação. O código completo está preservado para uso futuro com um servidor. As rotas `/conta`, `/painel` e `/admin` apresentam essa informação, sem simular login, pagamentos ou dados privados. Nenhuma chave Supabase é necessária para o workflow e nenhuma credencial de backend deve ser adicionada ao artefato estático.

Imagens selecionadas no estúdio estático são armazenadas somente no IndexedDB do navegador. Não são uploads privados nem ficam no servidor do GitHub. A transferência entre dispositivos é por exportação/importação JSON. Preços públicos podem ser publicados pelo snapshot `public/catalog-settings.json`, exportado no painel da versão completa; veja [o roteiro do showroom](showroom.md).

## Configuração do GitHub

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. O modo de publicação deve ser `workflow`, não o modo legado por branch. Em **Settings → Actions → General**, Actions deve estar habilitado e as ações oficiais utilizadas pelo workflow precisam ser permitidas.

O job de publicação recebe somente `pages: write` e `id-token: write`; o job de compilação tem `contents: read` e `pages: read` para consultar a configuração. O ambiente `github-pages` deve permitir implantação a partir de `main`. Caso exista aprovação obrigatória nesse ambiente, a execução ficará aguardando um aprovador autorizado. Não desative regras de proteção para contornar uma aprovação.

## Verificações

```powershell
pnpm lint
pnpm test
pnpm build
pnpm build:pages
node scripts/verify-pages.mjs
```

O verificador exige as 84 rotas de demonstrações/estúdios, os recursos com o prefixo correto, `.nojekyll` e ausência de APIs/arquivos privados. `out/deployment.json` registra o SHA do commit compilado para verificar a publicação real, além do resultado do workflow.

Referências: [exportação estática Next.js](https://nextjs.org/docs/app/guides/static-exports), [basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath), [workflows GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
