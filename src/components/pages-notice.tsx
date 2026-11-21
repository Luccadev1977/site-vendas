import Link from 'next/link';
import { Layers3, HardDrive, ShieldCheck } from 'lucide-react';
export function PagesNotice() {
  return (
    <main id="conteudo" className="wrap legal">
      <span className="eyebrow">PUBLICAÇÃO NO GITHUB PAGES</span>
      <h1>Sua ideia começa por aqui.</h1>
      <p>
        Esta publicação oferece o catálogo completo, as demonstrações navegáveis e o estúdio de
        personalização. Você pode salvar um rascunho neste navegador, exportar sua configuração e
        entrar na conta para enviar um pedido e acompanhar a proposta.
      </p>
      <div className="panel" style={{ marginBlock: 30 }}>
        <h2 style={{ marginTop: 0 }}>
          <HardDrive size={20} style={{ display: 'inline', marginRight: 10 }} />O que fica no seu
          dispositivo
        </h2>
        <p>
          Rascunhos e imagens locais permitem experimentar antes de entrar na conta. Exportar o
          projeto salva uma cópia no seu dispositivo. Para solicitar atendimento, use Enviar o
          pedido; a confirmação só aparece depois que o pedido é registrado na sua conta.
        </p>
        <h2>
          <ShieldCheck size={20} style={{ display: 'inline', marginRight: 10 }} />
          Contas e dados privados
        </h2>
        <p>
          Contas, pedidos, mensagens e arquivos utilizam o Supabase com acesso restrito. O cliente
          acompanha somente os próprios pedidos; o administrador analisa solicitações e envia
          propostas. Se a integração estiver indisponível, o site informa o problema sem confirmar
          um pedido. O Pix é liberado após aprovar a proposta e o pagamento é conferido manualmente.
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
