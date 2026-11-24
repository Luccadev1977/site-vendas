'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { browserConfigured } from '@/lib/browser-platform';
import { browserSupabase } from '@/lib/supabase/browser';
import { routeWithoutBasePath } from '@/lib/deployment';
import { routeTemplate } from '@/lib/template-routes';
import { defaultWhatsApp, whatsappURL, type WhatsAppSettings } from '@/lib/contact';
export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M16 .8A15 15 0 0 0 3.1 23.5L1 31l7.7-2A15.1 15.1 0 1 0 16 .8m0 27.3a12.2 12.2 0 0 1-6.2-1.7l-.5-.3-4.5 1.2 1.2-4.4-.3-.5A12.3 12.3 0 1 1 16 28.1m6.7-9.1c-.4-.2-2.2-1.1-2.6-1.2s-.6-.2-.9.2-1 1.2-1.2 1.4-.4.3-.8.1a10 10 0 0 1-3-1.8 11 11 0 0 1-2.1-2.6c-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.2 0-.5 0-.7l-1.2-2.8c-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.7.1-1 .5a4.2 4.2 0 0 0-1.3 3.1c0 1.8 1.4 3.6 1.6 3.8s2.7 4.2 6.5 5.9c.9.4 1.6.6 2.2.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8s-.3-.3-.7-.5" />
    </svg>
  );
}
export function FloatingWhatsApp() {
  const [settings, setSettings] = useState<WhatsAppSettings>(defaultWhatsApp);
  const path = routeWithoutBasePath(usePathname());
  const hidden = /^\/(admin|painel|conta)(\/|$)/.test(path);
  useEffect(() => {
    if (hidden || !browserConfigured()) return;
    let active = true;
    const load = async () => {
      const { data, error } = await browserSupabase()
        .from('site_settings')
        .select('phone,message,enabled')
        .eq('singleton', true)
        .maybeSingle();
      if (active && !error && data) setSettings(data);
    };
    void load();
    window.addEventListener('nexo-refresh', load);
    return () => {
      active = false;
      window.removeEventListener('nexo-refresh', load);
    };
  }, [hidden]);
  const model = /^\/(demo|studio)\/([^/]+)/.exec(path);
  const href = whatsappURL(settings, model ? routeTemplate(model[2])?.name : undefined);
  if (!href || hidden) return null;
  return (
    <a
      className={`whatsapp-float ${path.startsWith('/studio/') ? 'in-studio' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar com o Nexo Studio pelo WhatsApp"
      title="Fale com o Nexo Studio"
    >
      <WhatsAppIcon />
    </a>
  );
}
