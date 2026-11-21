import { Suspense } from 'react';
import { PagesPortal } from '@/components/pages-portal';
export const metadata = { title: 'Administração Nexo', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Suspense fallback={<p className="wrap portal-loading">Preparando acesso seguro...</p>}>
      <PagesPortal view="admin-project" />
    </Suspense>
  );
}
