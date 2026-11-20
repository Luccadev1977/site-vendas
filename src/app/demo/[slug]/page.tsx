import { notFound } from 'next/navigation';
import { catalog } from '@/lib/data';
import { routeTemplate } from '@/lib/template-routes';
import { DemoView } from '@/components/demo-view';
import { cache } from 'react';
const find = cache(async (slug: string) => {
  const data = await catalog();
  return (
    data.templates.find((t) => t.slug === slug) || (data.local ? routeTemplate(slug) : undefined)
  );
});
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const t = await find((await params).slug);
  return {
    title: t ? t.name + ' — Demonstração' : 'Modelo indisponível',
    description: t?.description,
    robots: { index: false, follow: true },
  };
}
export default async function Demo({ params }: { params: Promise<{ slug: string }> }) {
  const t = await find((await params).slug);
  if (!t) notFound();
  return <DemoView template={t} />;
}
