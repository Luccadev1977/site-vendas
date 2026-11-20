'use client';
import { useRef, useState } from 'react';
import type { SiteConfig, Template } from '@/lib/domain';
import { PreviewImage } from './preview-image';
export function contrast(hex: string) {
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) || [0, 0, 0];
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.36 ? '#151b25' : '#f5f5f0';
}
const sceneCopy: Record<
  string,
  { section: string; items: string[]; detail: string; about: string }
> = {
  law: {
    section: 'Áreas de atuação',
    items: ['Empresas & contratos', 'Pessoas & patrimônio', 'Consultoria preventiva'],
    detail: 'Uma visão cuidadosa sobre cada questão.',
    about: 'Relações construídas com clareza.',
  },
  restaurant: {
    section: 'Um menu, muitas histórias',
    items: ['Da horta à mesa', 'A delicadeza do mar', 'O último doce'],
    detail: 'Ingredientes selecionados · Menu ilustrativo',
    about: 'Sazonal por natureza. Memorável por escolha.',
  },
  barber: {
    section: 'O ritual do cuidado',
    items: ['Corte & expressão', 'Barba & acabamento', 'O ritual completo'],
    detail: 'Uma experiência dedicada ao seu estilo.',
    about: 'Tradição nas mãos. Atitude no olhar.',
  },
  clinic: {
    section: 'Cuidado em cada fase',
    items: ['Escuta e prevenção', 'Olhar integrado', 'Bem-estar contínuo'],
    detail: 'Especialidades e profissionais fictícios.',
    about: 'Saúde começa com acolhimento.',
  },
  dental: {
    section: 'Cada sorriso é singular',
    items: ['Prevenção em foco', 'Harmonia do sorriso', 'Cuidado restaurador'],
    detail: 'Conteúdo ilustrativo. Não constitui orientação de saúde.',
    about: 'Técnica, delicadeza e atenção.',
  },
  realty: {
    section: 'Espaços selecionados',
    items: ['Casa Jardim', 'Apartamento Horizonte', 'Residência Lago'],
    detail: 'Imóvel fictício · Disponibilidade demonstrativa',
    about: 'Uma curadoria de lugares para pertencer.',
  },
  commerce: {
    section: 'A coleção essencial',
    items: ['Luminária Arco', 'Vaso Matéria', 'Cadeira Linha'],
    detail: 'Objeto conceitual · Valor sob consulta',
    about: 'Menos excesso. Mais significado.',
  },
  portfolio: {
    section: 'Projetos selecionados',
    items: ['Entre formas', 'Outra perspectiva', 'Novos caminhos'],
    detail: 'Projeto autoral fictício · Design & direção de arte',
    about: 'Um olhar atento ao que ainda pode ser.',
  },
  fitness: {
    section: 'Encontre o seu ritmo',
    items: ['FORÇA', 'MOVIMENTO', 'EQUILÍBRIO'],
    detail: 'Programa demonstrativo · Sem matrícula ou cobrança',
    about: 'A melhor evolução é a sua.',
  },
  technology: {
    section: 'Construído para o próximo',
    items: ['PLATAFORMA / 01', 'DADOS / 02', 'CONEXÕES / 03'],
    detail: 'Arquitetura conceitual · Integração demonstrativa',
    about: 'Complexidade por dentro. Simplicidade para você.',
  },
  education: {
    section: 'O que você quer aprender?',
    items: ['Design de experiências', 'Tecnologia criativa', 'Comunicação que conecta'],
    detail: 'Curso ilustrativo · Sem inscrição real',
    about: 'Curiosidade é o primeiro passo.',
  },
  architecture: {
    section: 'Espaços com significado',
    items: ['Casa Horizonte', 'Refúgio Urbano', 'Atelier da Luz'],
    detail: 'Estudo conceitual · Arquitetura & interiores',
    about: 'O essencial também pode surpreender.',
  },
  business: {
    section: 'Possibilidades para crescer',
    items: ['Estratégia com clareza', 'Cultura de colaboração', 'Transformação em prática'],
    detail: 'Soluções ilustrativas · Escopo sob análise',
    about: 'O futuro se constrói em boas conexões.',
  },
};
export function SitePreview({
  config: c,
  template,
  onEdit,
}: {
  config: SiteConfig;
  template: Template;
  onEdit?: (field: keyof SiteConfig) => void;
}) {
  const root = useRef<HTMLDivElement>(null),
    [selected, setSelected] = useState(-1),
    [sent, setSent] = useState(false),
    [dimension, setDimension] = useState('platform');
  const scene = template.content.scene || 'business',
    layout = template.content.layout || 'split',
    copy = sceneCopy[scene] || sceneCopy.business;
  const go = (s: string) =>
    root.current
      ?.querySelector(`[data-section="${s}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const editable = (field: keyof SiteConfig) =>
    onEdit
      ? {
          onClick: () => onEdit(field),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') onEdit(field);
          },
          tabIndex: 0,
          role: 'button' as const,
          'aria-label': `Editar ${field === 'title' ? 'título' : field === 'company' ? 'nome da empresa' : field === 'subtitle' ? 'subtítulo' : field === 'description' ? 'descrição' : 'slogan'}`,
          className: 'preview-editable',
        }
      : {};
  const vars = {
    '--preview-bg': c.background,
    '--preview-text': c.textColor || contrast(c.background),
    '--preview-accent': c.primary,
    '--preview-secondary': c.secondary,
    '--preview-highlight': c.highlight || c.primary,
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
  const image = c.heroImage || '/images/architecture.svg';
  const labels: Record<string, string> = {
    sobre: 'Sobre',
    servicos:
      scene === 'restaurant'
        ? 'Menu'
        : scene === 'commerce'
          ? 'Coleção'
          : scene === 'architecture' || scene === 'portfolio'
            ? 'Projetos'
            : 'Explore',
    galeria: 'Galeria',
    contato: 'Contato',
  };
  return (
    <div
      ref={root}
      className={`site-preview showroom-preview preview-${template.style} scene-${scene} composition-${layout}`}
      style={vars}
    >
      <nav className="preview-nav" aria-label="Navegação da demonstração">
        <span className="preview-brand" {...editable('company')}>
          {c.logo && <PreviewImage src={c.logo} alt="Logotipo" />}
          {c.company}
        </span>
        <div className="preview-nav-links">
          {c.sections
            .filter((s) => ['sobre', 'servicos', 'contato'].includes(s))
            .map((s) => (
              <button key={s} onClick={() => go(s)}>
                {labels[s]}
              </button>
            ))}
        </div>
      </nav>
      <section className="preview-hero">
        <div className="preview-hero-copy">
          <span className="preview-eyebrow" {...editable('slogan')}>
            {c.slogan}
          </span>
          <h1
            {...editable('title')}
            role={undefined}
            aria-label={undefined}
            title={onEdit ? 'Clique ou pressione Enter para editar o título' : undefined}
          >
            {c.title}
          </h1>
          <p {...editable('subtitle')}>{c.subtitle}</p>
          <button
            className="preview-button"
            onClick={() => go(c.sections.includes('servicos') ? 'servicos' : c.sections[0])}
          >
            {c.cta || 'Saiba mais'}
          </button>
          {layout === 'digital' && (
            <div className="digital-controls" aria-label="Experiência interativa">
              {[
                ['platform', 'Plataforma'],
                ['data', 'Dados'],
                ['network', 'Conexões'],
              ].map(([id, label]) => (
                <button key={id} aria-pressed={dimension === id} onClick={() => setDimension(id)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="preview-hero-art">
          <PreviewImage src={image} alt={`Imagem ilustrativa de ${c.company}`} eager />
          {layout === 'digital' && (
            <div className={`digital-orbit orbit-${dimension}`}>
              <i />
              <i />
              <b>
                {dimension === 'platform'
                  ? 'N / CORE'
                  : dimension === 'data'
                    ? 'DATA / FLOW'
                    : 'CONNECTED'}
              </b>
            </div>
          )}
          <span className="image-caption">
            {scene === 'restaurant'
              ? 'SABORES DA ESTAÇÃO'
              : scene === 'architecture'
                ? 'MATÉRIA. LUZ. ESPAÇO.'
                : scene === 'commerce'
                  ? 'A CURADORIA ESSENCIAL'
                  : 'UMA NOVA PERSPECTIVA'}
          </span>
        </div>
      </section>
      {(layout === 'luxury' || scene === 'fitness' || layout === 'digital') && (
        <div className="preview-marquee" aria-hidden="true">
          {layout === 'luxury'
            ? 'ESTRATÉGIA · CULTURA · LEGADO'
            : scene === 'fitness'
              ? 'MOVE YOUR LIMITS · ENCONTRE SEU RITMO'
              : 'IMAGINE · CREATE · CONNECT'}
          <span>✳</span>
        </div>
      )}
      {c.sections.includes('sobre') && (
        <section className="preview-block preview-about" data-section="sobre">
          <span className="preview-eyebrow">
            {scene === 'portfolio' ? 'O PROCESSO' : 'NOSSA PERSPECTIVA'}
          </span>
          <h2>{copy.about}</h2>
          <p {...editable('description')}>{c.description}</p>
        </section>
      )}
      {c.sections.includes('servicos') && (
        <section className="preview-block preview-offerings" data-section="servicos">
          <div className="preview-section-heading">
            <div>
              <span className="preview-eyebrow">
                {scene === 'restaurant' ? 'DA NOSSA COZINHA' : 'UMA SELEÇÃO COM PROPÓSITO'}
              </span>
              <h2>{copy.section}</h2>
            </div>
            <span>Conteúdo demonstrativo</span>
          </div>
          <div className="preview-offering-grid">
            {c.services.map((service, i) => (
              <article className={selected === i ? 'selected' : ''} key={`${i}-${service}`}>
                {[
                  'realty',
                  'commerce',
                  'portfolio',
                  'architecture',
                  'restaurant',
                  'education',
                ].includes(scene) && (
                  <PreviewImage
                    src={c.images[i] || image}
                    alt={`${copy.items[i % 3]} — imagem ilustrativa`}
                    className={`offering-image crop-${i % 3}`}
                  />
                )}
                <button
                  aria-expanded={selected === i}
                  onClick={() => setSelected(selected === i ? -1 : i)}
                >
                  <span>
                    {scene === 'fitness'
                      ? ['/ FORÇA', '/ FOCO', '/ FLUXO'][i % 3]
                      : scene === 'technology'
                        ? '↗'
                        : copy.items[i % 3]}
                  </span>
                  <h3>{service || copy.items[i % 3]}</h3>
                  <b>{selected === i ? '−' : '+'}</b>
                </button>
                <p>{copy.detail}</p>
                {selected === i && (
                  <div className="offering-detail">
                    {scene === 'commerce'
                      ? 'Detalhes de materiais e dimensões apresentados como exemplo. Nenhum carrinho, cobrança ou pedido é criado.'
                      : scene === 'realty'
                        ? 'Descrição, localização e ficha técnica fictícias. Não há imóvel anunciado nem reserva real.'
                        : scene === 'education'
                          ? 'Programa conceitual para explorar a apresentação do curso. Nenhuma matrícula é realizada.'
                          : `Explore uma apresentação de ${service.toLowerCase()}. Esta interação é uma demonstração visual, sem agendamento, contratação ou envio de dados.`}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {c.sections.includes('galeria') && (
        <section className="preview-block preview-gallery-block" data-section="galeria">
          <span className="preview-eyebrow">UM OLHAR MAIS PRÓXIMO</span>
          <h2>
            {scene === 'commerce'
              ? 'Matéria e expressão.'
              : scene === 'architecture'
                ? 'A luz desenha o espaço.'
                : 'Imagens que contam histórias.'}
          </h2>
          <div className="preview-gallery">
            {(c.images.length ? c.images : [image, image, image]).map((src, i) => (
              <PreviewImage
                key={`${src}-${i}`}
                src={src}
                alt={`Galeria ilustrativa ${i + 1}`}
                className={`crop-${i % 3}`}
              />
            ))}
          </div>
        </section>
      )}
      {c.sections.includes('equipe') && (
        <section className="preview-block" data-section="equipe">
          <span className="preview-eyebrow">PESSOAS & POSSIBILIDADES</span>
          <h2>Uma equipe, diferentes olhares.</h2>
          <div className="preview-team">
            {['Alex', 'Marina', 'Caio'].map((n, i) => (
              <div key={n}>
                <span>{n[0]}</span>
                <h3>{n} · pessoa fictícia</h3>
                <p>{['Direção', 'Projetos', 'Relacionamento'][i]}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {c.sections.includes('depoimentos') && (
        <section className="preview-block">
          <span className="preview-eyebrow">HISTÓRIAS A CONSTRUIR</span>
          <h2>Boas experiências merecem ser compartilhadas.</h2>
          <p>
            Espaço reservado para depoimentos reais, publicados com autorização. Não exibimos
            avaliações fictícias como recomendações de clientes.
          </p>
        </section>
      )}
      {c.sections.includes('faq') && (
        <section className="preview-block" data-section="faq">
          <h2>Antes do próximo passo.</h2>
          {[
            'Este é um negócio real?',
            'Posso contratar por esta demonstração?',
            'O conteúdo pode ser personalizado?',
          ].map((q, i) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>
                {
                  [
                    'Não. Marca, pessoas, produtos e informações são fictícios, usados apenas para apresentar o modelo.',
                    'Não. A demonstração não recebe reservas, pagamentos ou pedidos.',
                    'Sim. Identidade, cores, textos, imagens e seções podem ser ajustados no estúdio.',
                  ][i]
                }
              </p>
            </details>
          ))}
        </section>
      )}
      {c.sections.includes('contato') && (
        <section className="preview-block preview-contact" data-section="contato">
          <div>
            <span className="preview-eyebrow">O PRÓXIMO PASSO</span>
            <h2>Uma boa conversa abre possibilidades.</h2>
            <p>Conheça a apresentação do contato.</p>
            <div className="preview-contact-list">
              {[c.email, c.phone, c.address, c.instagram].filter(Boolean).map((v, i) => (
                <span key={i}>{v}</span>
              ))}
            </div>
            {c.features.includes('whatsapp') && c.phone.replace(/\D/g, '').length >= 10 && (
              <a
                className="preview-button"
                href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir WhatsApp informado
              </a>
            )}
            {c.features.includes('agendamento') && (
              <p>Agendamento solicitado. Não há reserva real nesta prévia.</p>
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
              <button className="preview-button">Testar formulário</button>
              <small role="status">
                {sent
                  ? 'Prévia testada. Nenhuma mensagem foi enviada.'
                  : 'Formulário demonstrativo. Não envia dados.'}
              </small>
            </form>
          ) : (
            <p>Os canais informados são exibidos como parte da personalização.</p>
          )}
        </section>
      )}
      {c.features.includes('blog') && (
        <section className="preview-block">
          <h2>Perspectivas & ideias.</h2>
          <p>Área editorial solicitada. Artigos e gerenciamento serão definidos na proposta.</p>
        </section>
      )}
      {c.features.includes('catalogo') && scene !== 'commerce' && (
        <section className="preview-block">
          <h2>Uma curadoria para o seu negócio.</h2>
          <p>Catálogo solicitado. Produtos e integrações dependem do escopo aprovado.</p>
        </section>
      )}
      <footer className="preview-footer">
        <span>
          {c.company} © {new Date().getFullYear()}
        </span>
        <span>Marca fictícia · Imagens ilustrativas · Sem transações reais</span>
      </footer>
    </div>
  );
}
