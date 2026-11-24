# Cadastro e confirmação por e-mail — 24/11/2026

## Estado real da implantação

No projeto `dhgyfncmvwnlehfelsth`, a CLI oficial confirmou a aplicação de **três propriedades de Auth** na primeira entrega: senha mínima de 8 caracteres, Site URL de produção e URLs de retorno. Confirm Email já estava habilitado e foi preservado. O diff posterior retornou zero propriedades declaradas divergentes na configuração parcial. Aquela alteração de Auth não modificou SMTP, MFA, limites ou banco. A implantação SQL posterior foi autorizada separadamente e está registrada em [supabase-migrations.md](supabase-migrations.md).

A tentativa de publicar os dois templates personalizados foi **recusada pelo próprio Supabase**, com HTTP 400 / `entitlement_required` (`auth.email_templates`): o projeto gratuito utiliza o provedor padrão, que não permite essa modificação sem SMTP próprio ou mudança de plano. O proprietário informou não possuir domínio nem SMTP. Não houve contratação nem alteração de plano. Portanto, **HTML e assuntos personalizados estão preparados nos arquivos; ainda não estão ativos no serviço hospedado**.

O serviço padrão possui restrições de destinatários e limites. Mesmo uma resposta aceita do cadastro não comprova entrega na caixa postal. O login da conta existente e o painel administrativo foram verificados no serviço real; envio por SMTP próprio, recebimento em Gmail/Outlook e confirmação de uma nova conta pelo novo e-mail continuam sem homologação. O remetente próprio ainda não está ativo.

## Limitações verificadas em 24/11/2026

O conector confirmou que a organização do projeto permanece no plano **Free**. O projeto foi criado em 21/11/2026. Desde **03/06/2026**, projetos Free novos que usam o SMTP padrão não podem modificar seus templates de Auth; a configuração de SMTP próprio permite personalização sem exigir mudança de plano. Projetos anteriores à data têm tratamento diferente. Fonte: [comunicado oficial sobre templates no Free](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier).

A leitura atual pela CLI, com `config pull --dry-run` em configuração parcial ignorada, confirmou `auth.email.smtp.enabled = false` e host ausente. O resultado registrou `wrote = false`: nenhuma alteração de SMTP, template, conta, limite ou schema foi enviada ao Supabase nesta preparação. A tentativa de template rejeitada descrita acima pertence à primeira entrega, não foi repetida para contornar o bloqueio.

O envio padrão é destinado a testes: entrega somente a endereços autorizados da equipe, possui limite documentado de **2 mensagens por hora**, sujeito a mudanças, e não tem garantia de entrega. SMTP próprio começa com limite documentado de **30 mensagens por hora** no Auth, ajustável conforme a capacidade e os limites do provedor. Fonte: [SMTP e limites oficiais](https://supabase.com/docs/guides/auth/auth-smtp).

As frases “You're receiving this email because you signed up for an application powered by Supabase” e “Opt out of these emails” pertencem à mensagem do serviço padrão, não ao HTML do site ou aos templates Nexo versionados. Publicar no Pages não substitui o corpo desse e-mail. Não há regra de CSS, comentário HTML, recorte ou código para ocultar o rodapé obrigatório. A mudança será feita pelo transporte SMTP e editor de templates oficialmente permitidos.

O futuro provedor precisa permitir e-mails transacionais com a identidade do remetente. Se o plano escolhido impuser marca ou rodapé, respeite essa regra e escolha uma modalidade que permita a identidade desejada. Não há promessa de remover assinaturas obrigatórias de qualquer provedor. Confirmação de conta e recuperação são transacionais; o template não inclui publicidade nem cria opção de desativar a confirmação obrigatória da conta.

## Integração SMTP preparada, ainda sem ativação

- [smtp.example.toml](../supabase/smtp.example.toml) contém os campos de integração oficiais com o nome **Nexo Studio** e referências de ambiente, sem valores privados. É um exemplo optativo, não carregado pelo app ou workflow. A porta `587` é ilustrativa: use a porta TLS documentada pelo provedor.
- [`smtp.env.example`](../supabase/smtp.env.example) declara os quatro parâmetros privados separados do worker comercial. A eventual cópia `supabase/.env.smtp.local` é ignorada pelo Git. O caminho recomendado continua sendo preencher diretamente no Dashboard, sem entregar credenciais ao site.
- `supabase/config.toml` mantém a confirmação habilitada e os assuntos/templates preparados, sem habilitar um SMTP vazio. O build Pages remove variáveis `SUPABASE_AUTH_SMTP_*` do processo de exportação, além das credenciais de servidor já filtradas.
- Confirmação e recuperação usam a mesma identidade, botão, endereço alternativo e mensagem de segurança. O link permanece em fragmento com `TokenHash`, sem inserir token em logs do servidor estático, e só a validação do Auth confirma a conta. O prazo não é fixado no texto: vale a expiração configurada no projeto.

Prévia dos dois HTML, sem criar usuário ou enviar e-mail:

```powershell
pnpm email:preview
```

Os arquivos são gravados em `.local-tools/email-preview/`, fora do Git, com hash fictício. Sirva-os localmente para revisar o visual; os botões dessa prévia não confirmam uma conta real. Para ativação, ainda são necessários domínio/remetente verificados, provedor SMTP e credenciais preenchidas privadamente pelo proprietário. Não é preciso publicar backend Next.js nem trocar o GitHub Pages.

Prévias inspecionadas em navegador, com tabelas e estilos inline: [confirmação](screenshots/confirmation-email-preview.jpg) e [recuperação](screenshots/recovery-email-preview.jpg). A confirmação foi conferida em 320, 390, 768 e 1200 px, sem excesso horizontal; a recuperação foi conferida em 390 px. Essas imagens não comprovam entrega, aparência em Gmail/Outlook real nem remoção de marca no provedor ainda não configurado.

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
   Desative o rastreamento de e-mails/cliques nesse fluxo transacional para que o provedor não reescreva os links. Essa é a [orientação oficial de compatibilidade dos templates](https://supabase.com/docs/guides/auth/auth-email-templates#email-tracking), sem relação com ocultar rodapés.
5. **Email Templates → Confirm signup:** após verificar o remetente e habilitar SMTP, use assunto **Confirme sua conta no Nexo Studio** e copie integralmente [confirmation.html](../supabase/templates/confirmation.html). O HTML usa tabelas e estilos inline, sem marcas de terceiros, scripts, imagens remotas ou propaganda. Confira os dois links de ação. O Site URL deve terminar com `/` para o link de privacidade; o valor de produção versionado já atende a isso.
6. **Reset password:** assunto **Redefina sua senha no Nexo Studio** e [recovery.html](../supabase/templates/recovery.html). Isso mantém o mesmo callback estático para recuperação.
7. Alternativamente, após liberar a personalização com SMTP, `pnpm exec supabase config diff --remote=dhgyfncmvwnlehfelsth` e `pnpm exec supabase config push --remote=dhgyfncmvwnlehfelsth` permitem revisar/aplicar as propriedades declaradas em `supabase/config.toml`. Esse comando altera configuração, não aplica migrations. No estado atual ele é recusado por causa dos templates, portanto não deve ser repetido até configurar SMTP.

Não coloque credenciais de SMTP Auth no `.env.example` do site nem em Repository Variables do Pages. As variáveis SMTP já existentes no projeto pertencem ao worker comercial opcional, não configuram o envio do Supabase Auth.

Na opção CLI, use a referência SMTP somente em um diretório de configuração parcial ignorado, carregando `.env.smtp.local` exclusivamente no processo da CLI. Não cole senhas no TOML versionado. Revise o diff antes de aplicar: deve conter apenas os campos SMTP pretendidos. Publique os templates depois de confirmar que o provedor foi aceito. Não aumente limites nem desative Confirm email como solução de entrega. Em caso de falha, corrija o SMTP e mantenha a confirmação exigida; o envio padrão continuará sujeito às restrições e à marca originais se for restaurado.

## Homologação após ativar o provedor

1. Cadastre uma conta de teste que você controla, usando uma senha de 7 caracteres: deve falhar antes da chamada ao Auth. Use mínimo de 8 e confirmação igual para o cadastro válido.
2. Confira no Auth que a conta continua pendente até o clique no e-mail. Verifique nome e endereço From reais, assunto e recebimento em caixa postal/spam; examine SPF/DKIM/DMARC nos cabeçalhos. Confira também o HTML/MIME recebido: somente identidade Nexo, sem as duas frases do rodapé padrão nem assinatura inserida pelo SMTP. Não esconda rodapé exigido; resolva a modalidade de envio com o provedor.
3. Abra o botão em Gmail/Outlook e celular. Confira o retorno em `/site-vendas/conta/`, a mensagem **Conta confirmada com sucesso! Agora você pode acessar o Nexo Studio.** e a remoção do token da URL.
4. Entre com a senha escolhida e verifique a sessão no serviço. Reabra o link já utilizado: deve receber tratamento de link expirado/inválido e opção de reenvio.
5. Teste reenvio, senha divergente, conexão interrompida, limites e recuperação com nova senha. Não use `email_confirm: true`, `generateLink` administrativo ou contas criadas artificialmente para declarar que a entrega foi homologada.

Referências oficiais: [templates](https://supabase.com/docs/guides/auth/auth-email-templates), [SMTP e limites do provedor padrão](https://supabase.com/docs/guides/auth/auth-smtp), [configuração CLI](https://supabase.com/docs/guides/local-development/cli/config).
