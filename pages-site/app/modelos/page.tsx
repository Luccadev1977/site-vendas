import Link from 'next/link';
import { Suspense } from 'react';
import { PagesCatalog } from '@/components/pages-catalog';
export const metadata = {
  title: 'Modelos de sites',
  description: 'Explore 42 modelos navegáveis e personalize sua ideia no estúdio.',
};
export default function Models() {
  return (
    <main id="conteudo" className="wrap catalog-bottom showroom-page">
      <div className="page-intro">
        <div className="breadcrumbs">
          <Link href="/">Início</Link>
          <span>/</span>
          <span>Modelos</span>
        </div>
        <span className="eyebrow">O SHOWROOM NEXO · 42 POSSIBILIDADES</span>
        <h1>
          Uma presença à altura
          <br />
          <span className="muted">da sua próxima ideia.</span>
        </h1>
        <p>
          Explore 39 modelos para o seu negócio e três experiências Premium. Compare suas escolhas e
          transforme cada detalhe em algo seu.
        </p>
      </div>
      <Suspense fallback={<p className="notice">Preparando os filtros do catálogo...</p>}>
        <PagesCatalog />
      </Suspense>
      <p className="section-footnote">
        Explore e personalize antes de enviar. Entre na sua conta para acompanhar o pedido e a
        proposta.
      </p>
    </main>
  );
}
