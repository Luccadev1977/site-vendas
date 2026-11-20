/* eslint-disable @next/next/no-img-element -- Small local WebP thumbnails, native lazy loading, no server optimizer on Pages. */
import Link from 'next/link';
import { Eye, SlidersHorizontal, Gem, Plus, Check } from 'lucide-react';
import type { Template } from '@/lib/domain';
import { money } from '@/lib/domain';
import { isPremium, basePrice, styleLabels } from '@/lib/catalog';
import { assetPath } from '@/lib/deployment';
export function TemplateArtwork({ template }: { template: Template }) {
  const t = template,
    scene = t.content.scene || 'business';
  return (
    <div
      className={`showroom-art art-${t.style} art-scene-${scene} art-layout-${t.content.layout || 'split'}`}
      style={
        {
          '--art-accent': t.accent,
          '--art-bg': t.content.background || '#131b22',
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <div className="showroom-art-nav">
        <b>
          {t.content.company || t.name}
          <sup>®</sup>
        </b>
        <span>Sobre &nbsp; Coleção &nbsp; Contato</span>
      </div>
      <div className="showroom-art-content">
        <div>
          <small>{isPremium(t) ? 'THE SIGNATURE COLLECTION' : t.content.slogan}</small>
          <strong>{t.description}</strong>
          <span className="art-small-cta">{t.content.cta || 'Conheça as possibilidades'}</span>
        </div>
        <img
          loading="lazy"
          decoding="async"
          width="550"
          height="420"
          src={assetPath(t.content.heroImage || '/images/architecture.svg')}
          alt=""
        />
      </div>
      <div className="showroom-art-bottom">
        <span>
          {scene === 'restaurant'
            ? 'COZINHA DA ESTAÇÃO'
            : scene === 'commerce'
              ? 'OBJETOS & MATÉRIA'
              : 'DESIGN COM INTENÇÃO'}
        </span>
        <span>Explore a experiência</span>
      </div>
    </div>
  );
}
export function TemplatePrice({ template }: { template: Template }) {
  const price = basePrice(template);
  return (
    <span className="template-price">
      {price ? `A partir de ${money(price)}` : 'Sob consulta'}
      {price && <small>Estimativa inicial · orçamento final sob análise</small>}
    </span>
  );
}
export function TemplateCard({
  template,
  category,
  selected,
  onCompare,
}: {
  template: Template;
  category?: string;
  selected?: boolean;
  onCompare?: (t: Template) => void;
}) {
  const premium = isPremium(template);
  return (
    <article
      className={`template-card showroom-card ${premium ? 'is-premium' : ''}`}
      data-template={template.slug}
    >
      <Link
        prefetch={false}
        className="template-cover"
        href={`/demo/${template.slug}`}
        aria-label={`Visualizar demonstração ${template.name}`}
      >
        <TemplateArtwork template={template} />
        <span className="cover-action">
          <Eye size={17} />
          Visualizar demonstração
        </span>
        {premium && (
          <span className="premium-seal">
            <Gem size={13} /> PREMIUM
          </span>
        )}
      </Link>
      <div className="template-meta">
        <div>
          <span className="eyebrow subtle">
            {category || template.category_name || 'Modelo de site'}
          </span>
          <h3>{template.name}</h3>
        </div>
        <span className="style-tag">{styleLabels[template.style]}</span>
      </div>
      <p className="template-description">{template.description}</p>
      <TemplatePrice template={template} />
      <div className="template-card-actions">
        <Link prefetch={false} href={`/demo/${template.slug}`}>
          <Eye size={15} />
          Visualizar
        </Link>
        <Link prefetch={false} href={`/studio/${template.slug}`}>
          <SlidersHorizontal size={15} />
          Personalizar
        </Link>
        {onCompare && (
          <button
            aria-label={`Comparar ${template.name}`}
            aria-pressed={!!selected}
            onClick={() => onCompare(template)}
          >
            {selected ? <Check size={15} /> : <Plus size={15} />}
            <span>Comparar</span>
          </button>
        )}
      </div>
    </article>
  );
}
