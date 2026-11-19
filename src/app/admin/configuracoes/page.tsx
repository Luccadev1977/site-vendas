import { requireAdmin } from '@/lib/admin-data';
import { AdminSettings } from '@/components/admin';
export default async function Settings() {
  const auth = await requireAdmin();
  const [pix, audit] = await Promise.all([
    auth.db.rpc('get_pix'),
    auth.db.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100),
  ]);
  if (pix.error || audit.error) throw new Error('Não foi possível carregar as configurações.');
  return <AdminSettings initial={pix.data} audit={audit.data} />;
}
