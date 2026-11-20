import { notFound } from 'next/navigation';
import { demoTemplates, routeTemplate } from '@/lib/template-routes';
import { Studio } from '@/components/studio';
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
  return <Studio template={t} userId={null} />;
}
