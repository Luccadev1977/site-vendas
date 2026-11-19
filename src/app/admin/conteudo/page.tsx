import { requireAdmin } from '@/lib/admin-data';
import { ContentManager } from '@/components/content-manager';
export default async function Content() {
  const auth = await requireAdmin();
  const { data, error } = await auth.db
    .from('portfolio')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Não foi possível carregar os projetos realizados.');
  return <ContentManager items={data || []} />;
}
