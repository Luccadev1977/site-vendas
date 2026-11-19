import type { Metadata } from 'next';
import Link from 'next/link';
import { CatalogBrowser } from '@/components/catalog-browser';
import { catalog } from '@/lib/data';
export const metadata: Metadata = {
  title: 'Modelos de sites',
  description:
    'Explore modelos navegáveis para 14 categorias. Escolha entre os estilos minimalista, moderno e premium e personalize seu projeto.',
};
export default async function Models({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const data = await catalog(),
    params = await searchParams;
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
