import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalog } from '@/lib/data';
import { defaultConfig } from '@/lib/catalog';
import { SitePreview } from '@/components/site-preview';
export const metadata = { title: 'Demonstração navegável', robots: { index: false, follow: true } };
export default async function Demo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    data = await catalog(),
    template = data.templates.find((t) => t.slug === slug);
  if (!template) notFound();
  return (
    <main id="conteudo">
      <div className="demo-banner">
        <div>
          <Link href="/modelos">Voltar aos modelos</Link>
          <span> · {template.name} · Demonstração navegável</span>
        </div>
        <Link className="button button-small" href={`/studio/${template.slug}`}>
          Personalizar este modelo
        </Link>
      </div>
      <div className="demo-container">
        <SitePreview template={template} config={defaultConfig(template)} />
      </div>
    </main>
  );
}
