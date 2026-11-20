import type { Metadata } from 'next';
import { Header, Footer } from '@/components/chrome';
import './globals.css';
import './showroom.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Nexo Studio — Sites com a sua essência', template: '%s | Nexo Studio' },
  description:
    'Escolha um modelo, personalize sua ideia e construa uma presença digital com propósito. Desenvolvimento de sites sob medida.',
  openGraph: {
    title: 'Nexo Studio',
    description: 'Sites com a sua essência. Criados para o seu próximo passo.',
    locale: 'pt_BR',
    type: 'website',
    images: ['/opengraph-image'],
  },
};
const themeScript =
  "try{document.documentElement.dataset.theme=localStorage.getItem('nexo-theme')||'dark'}catch(e){}";
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
