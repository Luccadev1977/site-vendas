# Cadastro e confirmação por e-mail — 24/11/2026

## Estado real da implantação

No projeto `dhgyfncmvwnlehfelsth`, a CLI oficial confirmou a aplicação de **três propriedades de Auth**: senha mínima de 8 caracteres, Site URL de produção e URLs de retorno. Confirm Email já estava habilitado e foi preservado. O diff posterior retornou zero propriedades declaradas divergentes na configuração parcial. SMTP, MFA, limites existentes e banco permaneceram sem alterações; nenhuma migration foi aplicada.

A tentativa de publicar os dois templates personalizados foi **recusada pelo próprio Supabase**, com HTTP 400 / `entitlement_required` (`auth.email_templates`): o projeto gratuito utiliza o provedor padrão, que não permite essa modificação sem SMTP próprio ou mudança de plano. O proprietário informou não possuir domínio nem SMTP. Não houve contratação nem alteração de plano. Portanto, **HTML e assuntos personalizados estão preparados nos arquivos; ainda não estão ativos no serviço hospedado**.

O serviço padrão possui restrições de destinatários e limites. Mesmo uma resposta aceita do cadastro não comprova entrega na caixa postal. Não foram homologados envio real, recebimento em Gmail/Outlook, confirmação com link válido ou login posterior. Não se deve afirmar que o remetente próprio já funciona.

## O que mudou no site

- Cadastro com nome, e-mail, senha e confirmação de senha, requisitos enquanto digita, mostrar/ocultar os dois campos, validação de mínimo 8 e igualdade. Não há `maxLength` artificial no frontend para senha; continuam valendo os limites e verificações do Supabase Auth.
- Mensagens específicas sem expor respostas internas, tokens ou credenciais; bloqueio de envio duplicado enquanto a requisição está em andamento.
- Reenvio por `auth.resend({ type: 'signup', ... })`, intervalo visual de 60 segundos e tratamento dos limites reais do provedor. Não há retentativa automática em loop.
- Callback client-side em `/site-vendas/conta/`, independente das tabelas comerciais. A autenticação não desmonta a tela de confirmação nem tenta carregar o painel antes de mostrar o resultado.
- Links novos preparados usam `{{ .RedirectTo }}#token_hash={{ .TokenHash }}&type=email` e recuperação usa `type=recovery`. O fragmento não é enviado ao servidor estático. O navegador remove os parâmetros de autenticação da URL e chama `verifyOtp` do Supabase. A mensagem de conta confirmada depende de usuário com e-mail confirmado e sessão retornados pelo serviço.
- O callback também aceita `code` PKCE e links antigos com `token_hash` na query. No PKCE é necessário o navegador que iniciou o cadastro, pois ele guarda o verificador. Links inválidos, utilizados ou expirados oferecem reenvio; `confirmed=1` na URL não produz confirmação.
- Recuperação de senha preservada com mínimo de 8 e confirmação. A alteração exige sessão validada no Supabase; não existe senha administrativa embutida ou sessão fictícia.

## Passo a passo no Supabase

Abra o [Dashboard deste projeto](https://supabase.com/dashboard/project/dhgyfncmvwnlehfelsth/auth/url-configuration).

1. **Authentication → Sign In / Providers → Email:** mantenha Email e Confirm email habilitados. Em Password security, confira **Minimum password length = 8**. A localização dos rótulos pode variar conforme a versão do Dashboard.
2. **Authentication → URL Configuration:** Site URL `https://luccadev1977.github.io/site-vendas/`. Redirect URLs de produção: `https://luccadev1977.github.io/site-vendas/conta/**`. Desenvolvimento autorizado: `http://127.0.0.1:3000/conta/**` e `http://localhost:3000/conta/**`. Evite wildcards para domínios externos.
3. **SMTP próprio:** escolha domínio sob seu controle e um provedor com SMTP transacional. Você precisará de endereço de remetente verificado, host, porta, usuário e senha/token SMTP. Preencha credenciais **diretamente** em Authentication → Email / SMTP Settings. Não as envie na conversa nem ao GitHub. Configure o nome do remetente como **Nexo Studio**, com um endereço real do domínio verificado. Alterar somente HTML ou nome de exibição não cria esse remetente.
4. **DNS:** no painel do domínio, copie os registros SPF e DKIM exatos fornecidos pelo provedor. Mantenha apenas um SPF para o domínio, conciliando serviços já existentes. Configure DMARC e o alinhamento do domínio From conforme a orientação do provedor. Não invente seletores DKIM, destinos DNS ou endereços de relatórios. Aguarde a verificação do provedor antes de ativar o envio comercial.
5. **Email Templates → Confirm signup:** após habilitar SMTP, use assunto **Confirme sua conta no Nexo Studio** e copie integralmente [confirmation.html](../supabase/templates/confirmation.html). É o texto solicitado, em HTML com tabelas e estilos inline, sem marcas de terceiros, scripts, imagens remotas ou propaganda.
6. **Reset password:** assunto **Redefina sua senha no Nexo Studio** e [recovery.html](../supabase/templates/recovery.html). Isso mantém o mesmo callback estático para recuperação.
7. Alternativamente, após liberar a personalização com SMTP, `pnpm exec supabase config diff --remote=dhgyfncmvwnlehfelsth` e `pnpm exec supabase config push --remote=dhgyfncmvwnlehfelsth` permitem revisar/aplicar as propriedades declaradas em `supabase/config.toml`. Esse comando altera configuração, não aplica migrations. No estado atual ele é recusado por causa dos templates, portanto não deve ser repetido até configurar SMTP.

Não coloque credenciais de SMTP Auth no `.env.example` do site nem em Repository Variables do Pages. As variáveis SMTP já existentes no projeto pertencem ao worker comercial opcional, não configuram o envio do Supabase Auth.

## Homologação após ativar o provedor

1. Cadastre uma conta de teste que você controla, usando uma senha de 7 caracteres: deve falhar antes da chamada ao Auth. Use mínimo de 8 e confirmação igual para o cadastro válido.
2. Confira no Auth que a conta continua pendente até o clique no e-mail. Verifique nome e endereço From reais, assunto e recebimento em caixa postal/spam; examine SPF/DKIM/DMARC nos cabeçalhos.
3. Abra o botão em Gmail/Outlook e celular. Confira o retorno em `/site-vendas/conta/`, a mensagem **Conta confirmada com sucesso! Agora você pode acessar o Nexo Studio.** e a remoção do token da URL.
4. Entre com a senha escolhida e verifique a sessão no serviço. Reabra o link já utilizado: deve receber tratamento de link expirado/inválido e opção de reenvio.
5. Teste reenvio, senha divergente, conexão interrompida, limites e recuperação com nova senha. Não use `email_confirm: true`, `generateLink` administrativo ou contas criadas artificialmente para declarar que a entrega foi homologada.

Referências oficiais: [templates](https://supabase.com/docs/guides/auth/auth-email-templates), [SMTP e limites do provedor padrão](https://supabase.com/docs/guides/auth/auth-smtp), [configuração CLI](https://supabase.com/docs/guides/local-development/cli/config).
