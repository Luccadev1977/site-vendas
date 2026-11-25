# Arquivamento e lixeira — revisão da migration de 25/11/2026

Projeto exclusivo: `dhgyfncmvwnlehfelsth`. **Aplicação pendente de autorização do proprietário.** O histórico remoto contém as cinco migrations anteriores. A leitura encontrou dois pedidos reais, sem pagamentos ou arquivos registrados. Não serão usados pedidos reais para testar exclusão permanente.

SQL completo: [20261125133506_order_lifecycle.sql](../supabase/migrations/20261125133506_order_lifecycle.sql).

## O que a aplicação altera

- Adiciona `archived_at` e `deleted_at` anuláveis em `public.projects`, com dois índices parciais. Os pedidos existentes continuam ativos, sem mudança de status, briefing, personalização ou datas comerciais.
- Cria `public.manage_order(action,payload)` como `SECURITY INVOKER` e a implementação privada com `SECURITY DEFINER` e `search_path` vazio. Somente sessões autenticadas podem chamar o wrapper; a implementação exige o administrador já designado e e-mail confirmado. Não há promoção administrativa ou alteração de Auth.
- Reutiliza limites persistentes de ações, trava por projeto e auditoria. Não concede escrita direta nas tabelas nem altera as políticas de leitura de clientes. Um cliente comum não pode alterar os novos campos.
- Ajusta `private.may_upload` para coordenar uploads com a mesma trava de projeto, conservando validação de usuário confirmado, titularidade, estado e limite de arquivos. Impede corrida entre upload e exclusão.
- Não apaga dados durante a aplicação. As instruções `DELETE` estão dentro da função de exclusão, executada somente após uma solicitação administrativa específica.

## Comportamento após ativação

Arquivar preenche a data de arquivamento. Mover para a lixeira preenche `deleted_at`. Restaurar limpa ambas as datas e volta para Ativos. Repetir uma operação já realizada não duplica o evento. Nenhuma dessas ações muda o status comercial.

As pastas são administrativas: não revogam o acesso do cliente aos seus próprios registros comerciais, propostas, pagamentos ou conversas. A área financeira continua incluindo os registros preservados, mesmo se um pedido estiver arquivado ou na lixeira. A consulta de pedidos aplica prioridade Lixeira → Arquivados → Ativos.

## Exclusão permanente restrita

O pedido precisa estar na lixeira, ter status `cancelled`, `rejected` ou `draft`, e o administrador precisa confirmar seu número exato. A interface exige duas etapas, com digitação do número na segunda.

A função **recusa** exclusão se existir qualquer proposta, pagamento (inclusive pendente), arquivo registrado, objeto de Storage sob o projeto ou mensagem. Essa regra conservadora protege registros financeiros e evidências operacionais, sem presumir um prazo legal universal. Uma verificação no catálogo PostgreSQL também bloqueia exclusão se aparecer uma nova tabela relacionada ao pedido fora da lista revisada, mesmo que sua FK permita cascata. Novos relacionamentos exigem revisão explícita. Qualquer falha cancela a transação inteira.

Quando elegível e confirmado, são removidos o projeto, suas personalizações e suas leituras/histórico de status. Antes disso, a auditoria recebe número, identificador, status, datas e cópia integral do histórico de status, incluindo motivos/notas e responsáveis. Não copia o briefing nem mensagens. Auditorias anteriores e notificações são preservadas com referência ao projeto desassociada; a relação das notificações com a fila de e-mails permanece intacta. Não são apagados usuários, perfis, catálogo, propostas, pagamentos, arquivos ou mensagens.

Portanto, **aplicar a migration, arquivar, mover para a lixeira ou restaurar não causa perda dos dados originais**. Não seria correto prometer ausência de remoção na exclusão definitiva: ela remove os dados elegíveis descritos acima, somente após confirmação, mantendo os registros de retenção e auditoria. Nenhuma exclusão permanente será executada automaticamente na implantação.

A aprovação desta migration autoriza instalar essa capacidade, **não executar exclusão permanente de um pedido real**. O teste desse caminho ocorreu somente em PostgreSQL temporário local.

## Verificação anterior à aplicação

78 testes locais aprovados, aplicando os seis SQL em PostgreSQL temporário. Cobrem restauração, datas/conteúdo preservados, operação idempotente, bloqueio para clientes/anônimos/administrador não confirmado, confirmação obrigatória, preservação de pagamentos/propostas/arquivos/mensagens, histórico integral na auditoria e manutenção de notificações/fila após exclusão de fixture elegível. Um teste adicional cria um relacionamento futuro com cascata e comprova o bloqueio antes de perder qualquer registro.

Na revisão final, a leitura remota confirmou RLS ativa em `projects`, ausência de SELECT/UPDATE anônimo e ausência de UPDATE para `authenticated`. Os dois campos e as duas funções novas ainda não existem no remoto: esta migration não foi aplicada. Os cinco SQL anteriores e a autenticação administrativa não foram modificados.

Após aprovação, conferir novamente histórico e colunas e aplicar apenas `20261125133506_order_lifecycle.sql`, sem reset ou reaplicação das cinco anteriores. Conferir grants, RLS, advisors e o painel real. O workflow Pages não aplica migrations.

## Publicação permitida com a migration pendente

O proprietário autorizou versionar/publicar o código e este SQL, mantendo sua aplicação no Supabase pendente. A interface reconhece os campos de arquivamento/lixeira na resposta normal dos pedidos, sem consultar colunas inexistentes nem disparar uma RPC de sondagem. Enquanto os campos estiverem ausentes, preserva a lista Ativos e Abrir projeto, desativa Arquivados/Lixeira e não apresenta comandos de mutação. Uma lista vazia não oferece ações sobre pedidos.

A consulta do backend completo usa os campos existentes do registro por `SELECT *`, assim como o portal estático. Erros de schema/RPC de uma interface desatualizada recebem mensagem tratada, sem alterar pedidos. Depois da aplicação autorizada, os controles são liberados quando a consulta atualizada retornar ambos os campos. Não há botão de aplicar migration no frontend.

A inclusão deste arquivo no GitHub ou a execução dos 78 testes em PostgreSQL temporário não autoriza nem executa a migration no banco hospedado.
