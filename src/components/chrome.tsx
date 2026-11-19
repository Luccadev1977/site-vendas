'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { Menu, X, Sun, Moon, Layers3 } from 'lucide-react';
import { isGitHubPages, routeWithoutBasePath } from '@/lib/deployment';

function subscribeTheme(callback: () => void) {
  window.addEventListener('nexo-theme', callback);
  return () => window.removeEventListener('nexo-theme', callback);
}
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Nexo Studio — início">
      <span className="brand-symbol">
        <Layers3 size={21} strokeWidth={2.4} />
      </span>
      nexo<span className="brand-studio">studio</span>
      <span className="brand-period">.</span>
    </Link>
  );
}
export function Header() {
  const pathname = routeWithoutBasePath(usePathname());
  const [open, setOpen] = useState(false);
  const light = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme === 'light',
    () => false,
  );
  const toggle = () => {
    const theme = light ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('nexo-theme', theme);
    } catch {}
    window.dispatchEvent(new Event('nexo-theme'));
  };
  if (pathname.startsWith('/demo/')) return null;
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav aria-label="Navegação principal" className={open ? 'main-nav open' : 'main-nav'}>
          {[
            ['/', 'Início'],
            ['/modelos', 'Modelos'],
            ['/#como-funciona', 'Como funciona'],
            ['/#perguntas', 'Dúvidas'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={pathname === href ? 'active' : ''}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme-toggle"
            onClick={toggle}
            aria-label={light ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link className="account-link" href={isGitHubPages ? '/sobre-a-versao' : '/painel'}>
            {isGitHubPages ? 'Sobre esta versão' : 'Minha conta'}
          </Link>
          <Link className="button button-small header-cta" href="/modelos">
            Começar projeto
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  const pathname = routeWithoutBasePath(usePathname());
  if (pathname.startsWith('/demo/') || pathname.startsWith('/studio/')) return null;
  return (
    <footer className="site-footer wrap">
      <div>
        <Brand />
        <p>Boas ideias merecem uma presença à altura.</p>
      </div>
      <div className="footer-links">
        <Link href="/modelos">Modelos</Link>
        <Link href={isGitHubPages ? '/sobre-a-versao' : '/painel'}>
          {isGitHubPages ? 'Sobre esta versão' : 'Área do cliente'}
        </Link>
        <Link href="/privacidade">Privacidade</Link>
        <Link href="/termos">Termos de uso</Link>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Nexo Studio</span>
        <span>Design com intenção. Desenvolvimento com cuidado.</span>
      </div>
    </footer>
  );
}
