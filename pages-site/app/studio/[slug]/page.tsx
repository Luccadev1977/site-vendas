import { notFound } from 'next/navigation';
import { templates } from '@/lib/catalog';
import { Studio } from '@/components/studio';
export const metadata = {
  title: 'Estúdio de personalização',
  robots: { index: false, follow: false },
};
export const dynamicParams = false;
export function generateStaticParams() {
  return templates.map((t) => ({ slug: t.slug }));
}
export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = templates.find((t) => t.slug === slug);
  if (!template) notFound();
  return <Studio template={template} userId={null} />;
}
