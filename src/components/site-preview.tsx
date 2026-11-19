'use client';
/* eslint-disable @next/next/no-img-element -- Preview assets are private authenticated routes or local vectors. */
import { useRef, useState } from 'react';
import type { SiteConfig, Template } from '@/lib/domain';
import { assetPath } from '@/lib/deployment';
export function contrast(hex: string) {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) || [0, 0, 0];
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.36 ? '#151b25' : '#f5f5f0';
}
export function SitePreview({ config: c, template }: { config: SiteConfig; template: Template }) {
  const root = useRef<HTMLDivElement>(null),
    [selected, setSelected] = useState(-1),
    [sent, setSent] = useState(false);
  const go = (section: string) =>
    root.current
      ?.querySelector(`[data-section="${section}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const vars = {
    '--preview-bg': c.background,
    '--preview-text': contrast(c.background),
    '--preview-accent': c.primary,
    '--preview-secondary': c.secondary,
    '--preview-button': c.buttonColor,
    '--preview-button-text': contrast(c.buttonColor),
    '--preview-radius': `${c.radius}px`,
    '--preview-font':
      c.font === 'serif'
        ? 'Georgia, serif'
        : c.font === 'mono'
          ? 'Consolas, monospace'
          : "'Segoe UI', Arial, sans-serif",
  } as React.CSSProperties;
  return (
    <div ref={root} className={`site-preview preview-${template.style}`} style={vars}>
      <nav className="preview-nav" aria-label="Navegação da demonstração">
        <span className="preview-brand">
          {c.logo && <img src={assetPath(c.logo)} alt="Logotipo" />}
          {c.company}
        </span>
        <div className="preview-nav-links">
          {c.sections
            .filter((s) => ['sobre', 'servicos', 'contato'].includes(s))
            .map((s) => (
              <button key={s} onClick={() => go(s)}>
                {s === 'sobre' ? 'Sobre' : s === 'servicos' ? 'Soluções' : 'Contato'}
              </button>
            ))}
        </div>
      </nav>
      <section className="preview-hero">
        <div>
          <span className="preview-eyebrow">{c.slogan}</span>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
          <button
            className="preview-button"
            onClick={() => go(c.sections.includes('contato') ? 'contato' : 'sobre')}
          >
            {c.cta || 'Saiba mais'}
          </button>
        </div>
        <div className="preview-hero-art">
          <img
            src={assetPath(c.heroImage || '/images/architecture.svg')}
            alt={`Composição demonstrativa para ${c.company}`}
          />
        </div>
      </section>
      {c.sections.includes('sobre') && (
        <section className="preview-block" data-section="sobre">
          <span className="preview-eyebrow">NOSSA ESSÊNCIA</span>
          <h2>O cuidado está nos detalhes.</h2>
          <p>{c.description}</p>
        </section>
      )}
      {c.sections.includes('servicos') && (
        <section className="preview-block" data-section="servicos">
          <span className="preview-eyebrow">PENSADO PARA VOCÊ</span>
          <h2>
            {template.slug.startsWith('restaurantes')
              ? 'À sua mesa.'
              : template.slug.startsWith('lojas')
                ? 'Explore a coleção.'
                : template.slug.startsWith('portfolios')
                  ? 'Trabalhos & possibilidades.'
                  : 'Soluções que fazem sentido.'}
          </h2>
          <div className="preview-services">
            {c.services.map((service, i) => (
              <button
                key={i}
                className={`preview-service ${selected === i ? 'selected' : ''}`}
                onClick={() => setSelected(selected === i ? -1 : i)}
                aria-expanded={selected === i}
              >
                <span>✦</span>
                <h3>{service}</h3>
                <p>
                  {selected === i
                    ? `Esta seção apresenta ${service.toLowerCase()}. Conteúdo demonstrativo que será desenvolvido conforme o escopo aprovado.`
                    : 'Conheça os detalhes desta possibilidade.'}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
      {c.sections.includes('galeria') && (
        <section className="preview-block" data-section="galeria">
          <span className="preview-eyebrow">UM OUTRO OLHAR</span>
          <h2>Detalhes que inspiram.</h2>
          <div className="preview-gallery">
            {(c.images.length
              ? c.images
              : ['/images/architecture.svg', '/images/sculpture.svg', '/images/abstract.svg']
            ).map((src, i) => (
              <img key={i} src={assetPath(src)} alt={`Imagem ${i + 1} da galeria demonstrativa`} />
            ))}
          </div>
        </section>
      )}
      {c.sections.includes('depoimentos') && (
        <section className="preview-block">
          <span className="preview-eyebrow">CONEXÕES REAIS</span>
          <h2>Espaço para suas histórias.</h2>
          <p>
            Seção reservada para depoimentos de clientes, publicados somente com autorização.
            Nenhuma avaliação real cadastrada nesta prévia.
          </p>
        </section>
      )}
      {c.sections.includes('contato') && (
        <section className="preview-block preview-contact" data-section="contato">
          <div>
            <span className="preview-eyebrow">VAMOS CONVERSAR</span>
            <h2>
              O próximo passo
              <br />
              começa com um olá.
            </h2>
            <p>Conte um pouco sobre o que você tem em mente.</p>
            <div className="preview-contact-list">
              {c.email && <span>{c.email}</span>}
              {c.phone && <span>{c.phone}</span>}
              {c.address && <span>{c.address}</span>}
              {c.instagram && <span>@{c.instagram.replace('@', '')}</span>}
            </div>
            {c.features.includes('whatsapp') && c.phone.replace(/\D/g, '').length >= 10 && (
              <a
                className="preview-button"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
              >
                Conversar no WhatsApp
              </a>
            )}
            {c.features.includes('agendamento') && (
              <p style={{ marginTop: 15, fontSize: '.8em' }}>
                Agendamento solicitado no projeto. A integração será definida na proposta.
              </p>
            )}
          </div>
          {c.features.includes('formulario') ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <input
                aria-label="Nome na demonstração"
                placeholder="Seu nome"
                required
                maxLength={100}
              />
              <input
                type="email"
                aria-label="E-mail na demonstração"
                placeholder="Seu e-mail"
                required
              />
              <textarea
                aria-label="Mensagem na demonstração"
                placeholder="Sua mensagem"
                required
                maxLength={1000}
              />
              <button className="preview-button">
                {sent ? 'Prévia testada!' : 'Enviar mensagem'}
              </button>
              <small role="status">
                {sent
                  ? 'Este é um formulário demonstrativo. Nenhuma mensagem foi enviada.'
                  : 'Formulário demonstrativo. Não envia dados.'}
              </small>
            </form>
          ) : (
            <p>Entre em contato pelos canais informados ao lado.</p>
          )}
        </section>
      )}
      {c.features.includes('blog') && (
        <section className="preview-block">
          <span className="preview-eyebrow">CONTEÚDO & IDEIAS</span>
          <h2>Um espaço para compartilhar.</h2>
          <p>
            Blog solicitado. Os artigos e o gerenciamento de conteúdo serão definidos no
            desenvolvimento.
          </p>
        </section>
      )}
      {c.features.includes('catalogo') && (
        <section className="preview-block">
          <h2>Seu catálogo, sua curadoria.</h2>
          <p>
            Catálogo de produtos incluído na solicitação. Produtos, preços e integrações serão
            definidos na proposta.
          </p>
        </section>
      )}
      <footer className="preview-footer">
        <span>
          {c.company} © {new Date().getFullYear()}
        </span>
        <span>Prévia visual · Conteúdo demonstrativo</span>
      </footer>
    </div>
  );
}
