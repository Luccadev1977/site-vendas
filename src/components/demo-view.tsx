'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Monitor, Tablet, Smartphone, Gem } from 'lucide-react';
import type { Template } from '@/lib/domain';
import { defaultConfig, isPremium } from '@/lib/catalog';
import { SitePreview } from './site-preview';
export function DemoView({ template }: { template: Template }) {
  const [device, setDevice] = useState('desktop');
  return (
    <main id="conteudo" className="demo-workspace">
      <div className="demo-banner">
        <div>
          <Link href="/modelos">Todos os modelos</Link>
          <span>
            {' '}
            · {template.name}{' '}
            {isPremium(template) && <Gem size={13} style={{ display: 'inline' }} />}
          </span>
          <small className="demo-note">
            Marca e conteúdo fictícios. Sem compras, reservas ou transações reais.
          </small>
        </div>
        <div className="demo-device" aria-label="Dispositivo da demonstração">
          {[
            ['desktop', 'Desktop', Monitor],
            ['tablet', 'Tablet', Tablet],
            ['mobile', 'Celular', Smartphone],
          ].map(([id, label, Icon]) => (
            <button
              key={String(id)}
              aria-label={String(label)}
              aria-pressed={device === id}
              onClick={() => setDevice(String(id))}
            >
              {typeof Icon !== 'string' && <Icon size={17} />}
            </button>
          ))}
        </div>
        <Link className="button button-small" href={`/studio/${template.slug}`}>
          Personalizar este modelo
        </Link>
      </div>
      <div
        className="demo-container"
        style={{ maxWidth: device === 'mobile' ? 390 : device === 'tablet' ? 768 : 1600 }}
      >
        <SitePreview template={template} config={defaultConfig(template)} />
      </div>
    </main>
  );
}
