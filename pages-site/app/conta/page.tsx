import { Suspense } from 'react';
import { PagesAccount } from '@/components/pages-account';
export const metadata = { title: 'Minha conta Nexo', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Suspense fallback={<p className="wrap portal-loading">Preparando acesso seguro...</p>}>
      <PagesAccount />
    </Suspense>
  );
}
