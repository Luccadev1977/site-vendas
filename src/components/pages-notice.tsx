import Link from 'next/link';
import { Layers3, HardDrive, ShieldCheck } from 'lucide-react';
export function PagesNotice() {
  return (
    <main id="conteudo" className="wrap legal">
      <span className="eyebrow">PUBLICAÇÃO NO GITHUB PAGES</span>
      <h1>Sua ideia começa por aqui.</h1>
      <p>
        Esta publicação oferece o catálogo completo, as demonstrações navegáveis e o estúdio de
        personalização. Você pode salvar um rascunho neste navegador e baixar a configuração ou uma
        solicitação em JSON.
      </p>
      <div className="panel" style={{ marginBlock: 30 }}>
        <h2 style={{ marginTop: 0 }}>
          <HardDrive size={20} style={{ display: 'inline', marginRight: 10 }} />O que fica no seu
          dispositivo
        </h2>
        <p>
          Suas alterações são salvas no armazenamento local do navegador. O JSON é baixado por você
          e pode incluir os dados preenchidos no formulário. Nenhum pedido é enviado por esta
          versão.
        </p>
        <h2>
          <ShieldCheck size={20} style={{ display: 'inline', marginRight: 10 }} />
          Contas e dados privados
        </h2>
        <p>
          Login, painel administrativo, pedidos, mensagens, uploads na nuvem e pagamentos dependem
          de um servidor e da configuração do Supabase. O código dessas funções está preservado no
          repositório para utilização futura. Este endereço não recebe senhas, comprovantes ou
          pagamentos.
        </p>
        <p>
          Imagens escolhidas no estúdio ficam no seu navegador, em IndexedDB. A exportação JSON
          inclui essas imagens; importe o arquivo no estúdio do mesmo modelo para continuar em outro
          dispositivo.
        </p>
      </div>
      <Link href="/modelos" className="button">
        <Layers3 size={17} />
        Explorar modelos
      </Link>
    </main>
  );
}
