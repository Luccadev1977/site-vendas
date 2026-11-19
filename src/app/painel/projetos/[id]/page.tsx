import { projectData } from '@/lib/project-data';
import { ProjectWorkspace } from '@/components/project-workspace';
export const metadata = { title: 'Detalhes do projeto', robots: { index: false, follow: false } };
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectWorkspace {...await projectData(id)} />;
}
