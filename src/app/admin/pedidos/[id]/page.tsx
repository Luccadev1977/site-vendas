import { projectData } from '@/lib/project-data';
import { ProjectWorkspace } from '@/components/project-workspace';
export default async function Project({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectWorkspace {...await projectData(id, true)} />;
}
