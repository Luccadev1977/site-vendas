import Link from 'next/link';
import { Eye, SlidersHorizontal } from 'lucide-react';
import type { Template } from '@/lib/domain';
export function TemplateArtwork({ template }: { template: Template }) {
  return (
    <div
      className={`template-art art-${template.style}`}
      style={{ '--art-accent': template.accent } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="art-nav">
        <b>
          {template.content.company || template.name}
          <span>®</span>
        </b>
        <span>Sobre&nbsp;&nbsp; Serviços&nbsp;&nbsp; Contato</span>
      </div>
      <div className="art-body">
        <div className="art-copy">
          <small>
            {template.style === 'premium' ? 'THE SIGNATURE COLLECTION' : 'FEITO COM PROPÓSITO'}
          </small>
          <strong>{template.description}</strong>
          <span className="art-cta">Descubra sua próxima possibilidade</span>
        </div>
        <div className="art-image">
          <div className="art-orbit" />
          <div className="art-pillar" />
          <div className="art-pillar second" />
          <span>EST. 2026</span>
        </div>
      </div>
      <div className="art-bottom">
        <span>Estratégia & essência</span>
        <span>Uma nova perspectiva</span>
      </div>
    </div>
  );
}
export function TemplateCard({ template, category }: { template: Template; category?: string }) {
  return (
    <article className="template-card">
      <Link
        className="template-cover"
        href={`/demo/${template.slug}`}
        aria-label={`Explorar demonstração ${template.name}`}
      >
        <TemplateArtwork template={template} />
        <span className="cover-action">
          <Eye size={17} /> Explorar demonstração
        </span>
      </Link>
      <div className="template-meta">
        <div>
          <span className="eyebrow subtle">{category || 'Modelo de site'}</span>
          <h3>{template.name}</h3>
        </div>
        <span className="style-tag">{template.style}</span>
      </div>
      <div className="template-card-actions">
        <span className="palette-dots">
          <i style={{ background: template.accent }} />
          <i />
          <i />
        </span>
        <Link href={`/studio/${template.slug}`}>
          <SlidersHorizontal size={15} />
          Personalizar
        </Link>
      </div>
    </article>
  );
}
