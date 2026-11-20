import { notFound } from 'next/navigation';
import { demoTemplates, routeTemplate } from '@/lib/template-routes';
import { DemoView } from '@/components/demo-view';
export const dynamicParams = false;
export function generateStaticParams() {
  return demoTemplates.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const t = routeTemplate((await params).slug);
  return {
    title: t ? t.name + ' — Demonstração' : 'Modelo indisponível',
    description: t?.description,
    robots: { index: false, follow: true },
  };
}
export default async function Demo({ params }: { params: Promise<{ slug: string }> }) {
  const t = routeTemplate((await params).slug);
  if (!t) notFound();
  return <DemoView template={t} />;
}
