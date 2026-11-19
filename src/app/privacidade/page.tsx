export const metadata = { title: 'Política de Privacidade' };
export default function Privacy() {
  return (
    <main id="conteudo" className="wrap legal">
      <span className="eyebrow">TRANSPARÊNCIA SOBRE SEUS DADOS</span>
      <h1>Política de Privacidade</h1>
      <p>
        Esta plataforma usa seus dados para analisar solicitações de sites, preparar propostas,
        executar projetos contratados e manter a comunicação sobre o serviço.
      </p>
      <h2>Dados e finalidades</h2>
      <p>
        São tratados nome, e-mail, telefone, dados da empresa, informações do projeto,
        personalizações, mensagens, arquivos anexados e registros das decisões. Comprovantes são
        usados exclusivamente para conferência do pagamento. Não solicitamos senhas bancárias ou
        dados de cartão.
      </p>
      <h2>Base legal e acesso</h2>
      <p>
        O tratamento atende aos procedimentos preliminares relacionados ao contrato solicitados pelo
        titular, à execução contratual e às obrigações legais aplicáveis. A autorização no
        formulário registra a ciência sobre o tratamento. O cliente acessa seus próprios projetos; o
        administrador acessa dados necessários à operação.
      </p>
      <h2>Serviços utilizados</h2>
      <p>
        A autenticação, o banco e os arquivos utilizam Supabase. A hospedagem é definida pelo
        responsável pela implantação. O envio de notificações por e-mail pode usar o provedor SMTP
        configurado. Esses fornecedores podem processar dados em infraestrutura internacional; a
        configuração e as condições contratuais devem ser avaliadas pelo controlador antes da
        publicação comercial.
      </p>
      <h2>Armazenamento e retenção</h2>
      <p>
        Rascunhos do editor ficam neste navegador e podem conter informações inseridas por você. Em
        dispositivos compartilhados, remova o rascunho pelo armazenamento do navegador. Rascunhos na
        conta, pedidos, mensagens e comprovantes são privados. Registros contratuais e financeiros
        são mantidos pelo período necessário à prestação do serviço e às obrigações legais. Pedidos
        de exclusão são analisados considerando essas obrigações.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção, informação sobre
        compartilhamento, portabilidade quando aplicável, revisão das autorizações e exclusão de
        dados desnecessários, observadas as hipóteses legais de conservação. A exportação de cada
        projeto está disponível na sua área.
      </p>
      <h2>Contato do controlador</h2>
      <p>
        {process.env.PRIVACY_CONTACT_EMAIL ? (
          <>
            Para exercer seus direitos, entre em contato pelo e-mail{' '}
            <a href={`mailto:${process.env.PRIVACY_CONTACT_EMAIL}`}>
              {process.env.PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </>
        ) : (
          'O responsável pela plataforma deve cadastrar o canal de privacidade antes de abrir a operação comercial. Enquanto isso, use a conversa do projeto para solicitar atendimento sobre seus dados.'
        )}
      </p>
      <h2>Cookies e segurança</h2>
      <p>
        Utilizamos cookies necessários à sessão e armazenamento local para tema e rascunhos. Não
        incluímos rastreamento publicitário. Aplicamos controle de acesso no servidor e no banco,
        armazenamento privado e validação de arquivos. Não envie dados sensíveis desnecessários ao
        seu projeto.
      </p>
      <p>
        Atualização: 19 de novembro de 2026. Esta política deve ser complementada pelo controlador
        com sua identificação, canais e prazos de retenção antes do lançamento comercial.
      </p>
    </main>
  );
}
