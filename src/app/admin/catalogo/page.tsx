import { requireAdmin } from '@/lib/admin-data';
import { AdminCatalog } from '@/components/admin';
import type { Category, Template, Testimonial } from '@/lib/domain';
export default async function Catalog() {
  const auth = await requireAdmin();
  const [c, t, r] = await Promise.all([
    auth.db.from('categories').select('*').order('name'),
    auth.db.from('templates').select('*').order('name'),
    auth.db.from('testimonials').select('*').order('name'),
  ]);
  if (c.error || t.error || r.error) throw new Error('Não foi possível carregar o catálogo.');
  return (
    <AdminCatalog
      categories={c.data as Category[]}
      templates={t.data as Template[]}
      testimonials={r.data as Testimonial[]}
    />
  );
}
