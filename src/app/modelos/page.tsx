import type { Metadata } from 'next';
import Link from 'next/link';
import { CatalogBrowser } from '@/components/catalog-browser';
import { catalog } from '@/lib/data';
export const metadata: Metadata = {
  title: 'Modelos de sites',
  description:
    'Explore 39 modelos em 13 categorias e três experiências Premium. Compare, personalize e prepare seu projeto.',
};
export default async function Models({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const data = await catalog(),
    params = await searchParams;
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
      {data.error ? (
        <div className="notice error">
          Não foi possível carregar o catálogo. Tente novamente em instantes.
        </div>
      ) : (
        <CatalogBrowser
          categories={data.categories}
          templates={data.templates}
          initialCategory={params.categoria || ''}
        />
      )}
      <p className="section-footnote">
        Todas as demonstrações usam conteúdo ilustrativo. O site final é desenvolvido após análise e
        aprovação da proposta.
      </p>
    </main>
  );
}
