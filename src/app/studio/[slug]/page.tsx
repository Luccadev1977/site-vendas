import { notFound, redirect } from 'next/navigation';
import { routeTemplate } from '@/lib/template-routes';
import { catalog } from '@/lib/data';
import { session } from '@/lib/supabase/server';
import { Studio } from '@/components/studio';
import type { Project, Template } from '@/lib/domain';
export const metadata = {
  title: 'Estúdio de personalização',
  robots: { index: false, follow: false },
};
export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ projeto?: string }>;
}) {
  const { slug } = await params,
    query = await searchParams;
  const auth = await session();
  let initialProject: Project | undefined, template: Template | undefined;
  if (query.projeto) {
    if (!auth)
      redirect(`/conta?next=${encodeURIComponent(`/studio/${slug}?projeto=${query.projeto}`)}`);
    const { data: p } = await auth.db.from('projects').select('*').eq('id', query.projeto).single();
    if (!p || p.client_id !== auth.user.id) notFound();
    if (p.status !== 'draft') redirect(`/painel/projetos/${p.id}`);
    initialProject = p as Project;
    template = initialProject.template_snapshot;
  } else {
    const data = await catalog();
    template =
      data.templates.find((t) => t.slug === slug) || (data.local ? routeTemplate(slug) : undefined);
  }
  if (!template) notFound();
  return (
    <Studio
      key={initialProject?.id || slug}
      template={template}
      userId={auth?.user.id || null}
      initialProject={initialProject}
    />
  );
}
