import { notFound } from 'next/navigation';
import { demoTemplates, routeTemplate } from '@/lib/template-routes';
import { PagesStudio } from '@/components/pages-studio';
import { Suspense } from 'react';
export const dynamicParams = false;
export function generateStaticParams() {
  return demoTemplates.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const t = routeTemplate((await params).slug);
  return {
    title: t ? 'Personalizar ' + t.name : 'Estúdio',
    description: t?.description,
    robots: { index: false, follow: false },
  };
}
export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = routeTemplate((await params).slug);
  if (!t) notFound();
  return (
    <Suspense fallback={<p className="wrap portal-loading">Preparando estúdio...</p>}>
      <PagesStudio template={t} />
    </Suspense>
  );
}
