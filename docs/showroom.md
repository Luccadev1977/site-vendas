# Showroom Nexo Studio

A atualização de 20/11/2026 mantém 42 modelos públicos: 39 convencionais, em 13 categorias com os estilos Minimalista, Moderno e Elegante, e três Premium exclusivos. Premium é uma classificação independente do estilo. A definição está em `src/lib/catalog.ts`; o conteúdo antigo permanece em `src/lib/legacy-catalog.ts` para links históricos e compatibilidade.

## Composições e demonstrações

O renderizador compartilha navegação e seções, com três composições convencionais e variações de hierarquia, imagens e ritmo por negócio: menu de restaurante, serviços de barbearia, especialidades, imóveis, produtos editoriais, cursos, portfólios, projetos arquitetônicos e soluções corporativas. Os nomes, descrições e imagens são ilustrativos; não representam negócios, profissionais, tratamentos ou ofertas reais.

Luxury Business usa abertura cinematográfica, tipografia editorial e apresentação corporativa. Digital Experience usa órbitas e controles de plataforma/dados/conexões, transições visuais e painéis expansíveis. Signature Commerce usa composição editorial, produtos em colunas assimétricas e detalhes demonstrativos. Não há carrinho, pedido, reserva, matrícula ou pagamento funcional nessas demonstrações. O formulário informa que nenhum dado foi enviado.

## Catálogo e performance

Filtros combináveis por categoria, estilo e classificação, busca sem distinção de acentos e ordenação A–Z/Z–A. A coleção Premium tem cards maiores, selo e acabamento metálico. Visualizar, Personalizar e Comparar permanecem visíveis em telas de toque. Até três modelos podem ser comparados em uma tabela com categoria, estilo, recursos, personalização e investimento.

Miniaturas não carregam os sites completos: usam markup leve e imagens WebP locais com `loading="lazy"`, dimensões e decodificação assíncrona. Links de demonstrações/estúdios não antecipam o download de 42 rotas. Cards usam `content-visibility`; animações respeitam movimento reduzido. Fontes de sistema evitam downloads externos. Créditos em [imagens](image-credits.md).

## Personalização e persistência

O editor tem abas Identidade, Cores, Tipografia, Textos, Imagens, Seções, Funcionalidades e Informações comerciais. A barra superior reúne o projeto/modelo, histórico de até 80 alterações, rascunho, exportação, tela cheia e orçamento. A revisão mostra o conteúdo escolhido antes de abrir os detalhes da solicitação. Um clique nos principais textos da prévia abre o campo correspondente. No celular, ferramentas podem ser recolhidas; a área de ferramentas e a prévia têm rolagem independente.

O rascunho é salvo automaticamente após 550 ms no localStorage. Imagens escolhidas no Pages são guardadas no IndexedDB, com limite de 4 MiB por imagem, nos formatos PNG, JPEG e WebP, e prévia antes da confirmação. A configuração referencia IDs locais; não publica imagens nem cria uploads na nuvem. O schema aceito pelo servidor rejeita esses IDs locais.

Exportar baixa um JSON versão 2 com configuração, modelo e imagens locais em base64. Para continuar em outro dispositivo, abra o mesmo modelo e use **Importar projeto JSON**. Não existe sincronização entre dispositivos sem servidor. Limpar os dados do navegador, usar outro perfil ou navegação privada pode remover o rascunho. Um arquivo exportado pode conter imagens e informações pessoais: guarde-o com cuidado. Não há importação de HTML, scripts ou URLs arbitrárias.

Trocar a prévia entre Desktop, Tablet e Celular ou alternar abas mantém a edição. Desfazer/refazer funciona durante a sessão de edição; recarregar restaura o rascunho, mas inicia um histórico novo. A restauração do modelo pode ser desfeita durante a sessão.

## Preços e classificações

Nenhum preço comercial foi inventado. Todos os modelos iniciam com **Sob consulta**. Na versão completa, o administrador altera a classificação e o valor inicial em `/admin/catalogo`, com sessão autorizada e Supabase configurado. Valores configurados são apresentados como estimativas sujeitas ao orçamento final. A migration `20261120145745_showroom_catalog.sql` verifica a hierarquia entre preços Premium e convencionais, inclusive via RPC. As permissões e a auditoria existentes permanecem.

O Pages não executa o painel nem recebe alterações de banco em tempo real. Para publicar preços no artefato estático sem editar código:

1. No painel da versão completa, salve os valores e use **Exportar preços e classificações para o Pages**.
2. No GitHub, abra a pasta `public`, use **Add file → Upload files** e substitua `catalog-settings.json` pelo JSON exportado, mantendo esse nome. Faça commit em `main` pelo GitHub ou Git.
3. Aguarde o workflow **Deploy GitHub Pages** concluir. O arquivo contém somente IDs, classificações e preços públicos; não inclua credenciais ou dados de clientes.

O arquivo versionado inicialmente tem lista vazia, preservando os valores sob consulta. O build rejeita classificações inválidas, preços fora do limite e valores Premium inferiores ou iguais aos convencionais configurados. Não é necessário editar componentes, TypeScript ou SQL para atualizar esse snapshot. Novos modelos criados no banco exigem implementação e inclusão na exportação estática; este showroom mantém as 42 definições versionadas.

## Compatibilidade e banco

As migrations anteriores não foram reescritas. A nova migration arquiva apenas as 42 definições originalmente fornecidas (IDs `10000000-…`), preserva seus registros, troca seus slugs por `legacy-…`, registra o slug original e insere a nova coleção com IDs `11000000-…`. Projetos, snapshots, arquivos, mensagens, pagamentos e modelos personalizados do administrador não são apagados. As categorias anteriores que saíram da seleção ficam inativas; as novas categorias são adicionadas. Links públicos históricos têm variantes estáticas fora dos 42 itens do catálogo.

Antes de usar o backend, aplique as migrations em ordem no seu projeto Supabase e execute a homologação conectada. A entrega do showroom original não configurou Supabase. A atualização comercial subsequente acrescenta conta e painéis compatíveis com Pages; veja README e o registro de verificação mais recente. Os testes PGlite exercitam SQL e papéis reais de PostgreSQL, incluindo preços, autorização e snapshots; não substituem testes conectados de Auth, Storage e SMTP. Nenhuma credencial privada é enviada ao Pages.
