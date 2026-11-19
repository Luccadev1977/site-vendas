import Link from 'next/link';
import { Suspense } from 'react';
import { PagesCatalog } from '@/components/pages-catalog';
export const metadata = {
  title: 'Modelos de sites',
  description: 'Explore 42 modelos navegáveis e personalize sua ideia no estúdio.',
};
export default function Models() {
  return (
    <main id="conteudo" className="wrap catalog-bottom">
      <div className="page-intro">
        <div className="breadcrumbs">
          <Link href="/">Início</Link>
          <span>/</span>
          <span>Modelos</span>
        </div>
        <span className="eyebrow">SEU NEGÓCIO, SEU PONTO DE PARTIDA</span>
        <h1>
          Um modelo.
          <br />
          <span className="muted">Infinitas possibilidades.</span>
        </h1>
        <p>
          Explore, navegue e imagine. Encontre uma direção visual e transforme cada detalhe em algo
          seu.
        </p>
      </div>
      <Suspense fallback={<p className="notice">Preparando os filtros do catálogo...</p>}>
        <PagesCatalog />
      </Suspense>
      <p className="section-footnote">
        Demonstrações navegáveis e rascunhos locais. Pedidos, contas e pagamentos exigem a versão
        com servidor.
      </p>
    </main>
  );
}
