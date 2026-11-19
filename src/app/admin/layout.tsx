import { notFound, redirect } from 'next/navigation';
import { session } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin';
export const metadata = { title: 'Administração', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await session();
  if (!auth) redirect('/conta?next=/admin');
  if (!auth.admin) notFound();
  return <AdminShell>{children}</AdminShell>;
}
