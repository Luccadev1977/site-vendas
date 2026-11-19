import Link from 'next/link';
import Image from 'next/image';
import {
  MousePointer2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Code2,
  Search,
  MessagesSquare,
  Check,
  Plus,
  Monitor,
  Palette,
  Layers3,
} from 'lucide-react';
import { catalog, testimonials, portfolio } from '@/lib/data';
import { TemplateCard, TemplateArtwork } from '@/components/template-card';
import { Reveal } from '@/components/reveal';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [data, reviews, works] = await Promise.all([catalog(), testimonials(), portfolio()]);
  const featured = data.templates.filter((t) => t.featured).slice(0, 3);
  const hero = data.templates.find((t) => t.slug === 'institucional-moderno') || data.templates[0];
  return (
    <main id="conteudo">
      <section className="hero wrap">
        <Reveal className="hero-copy">
          <div className="pill">
            <span className="tiny-spark">✦</span> Seu próximo capítulo é digital
          </div>
          <h1>
            Seu negócio.
            <br />
            Sua essência.
            <br />
            <span>Seu próximo site.</span>
          </h1>
          <p>
            Transformamos a sua visão em uma presença digital única. Escolha um ponto de partida e
            deixe o resto com a gente.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/modelos">
              <Sparkles size={17} />
              Criar meu site
            </Link>
            <Link className="button button-outline" href="/modelos">
              Explorar modelos
            </Link>
          </div>
          <div className="hero-assurance">
            <span>
              <Check size={14} /> Personalização de verdade
            </span>
            <span>
              <Check size={14} /> Feito por especialistas
            </span>
          </div>
        </Reveal>
        <Reveal className="hero-visual">
          <div className="orbit-line orbit-one" />
          <div className="orbit-line orbit-two" />
          <div className="floating-label floating-top">
            <span className="blue-icon">
              <Palette size={19} />
            </span>
            <div>
              Com a sua identidade<small>Cada detalhe importa.</small>
            </div>
          </div>
          <div className="hero-browser">
            <div className="browser-toolbar">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="browser-address">
                <ShieldCheck size={10} /> seu-proximo-site.com.br
              </span>
              <span>＋</span>
            </div>
            {hero && <TemplateArtwork template={hero} />}
          </div>
          <div className="hero-phone">
            <div className="phone-notch" />
            <div className="phone-logo">
              aurora<span>®</span>
            </div>
            <div className="phone-art" />
            <h3>
              Uma nova
              <br />
              perspectiva.
            </h3>
            <p>
              O próximo passo
              <br />
              começa aqui.
            </p>
            <span className="phone-button">Conheça a Aurora</span>
            <div className="phone-home" />
          </div>
          <div className="floating-label floating-bottom">
            <span className="blue-icon">
              <Smartphone size={19} />
            </span>
            <div>
              Perfeito em qualquer tela<small>Desktop, tablet e celular.</small>
            </div>
            <span className="float-check">
              <Check size={14} />
            </span>
          </div>
          <div className="cursor-label">
            <MousePointer2 size={22} fill="#6992ff" />
            Sua ideia começa aqui
          </div>
          <div className="visual-caption">
            <span>DESIGN ORIGINAL</span>
            <span>DESENVOLVIMENTO SOB MEDIDA</span>
          </div>
        </Reveal>
      </section>
      <div className="trust-strip">
        <div className="wrap">
          <span>
            Mais que um site. <b>Um novo começo.</b>
          </span>
          <span>
            <Code2 />
            Desenvolvimento profissional
          </span>
          <span>
            <Smartphone />
            100% responsivo
          </span>
          <span>
            <ShieldCheck />
            Processo transparente
          </span>
        </div>
      </div>
      <section className="section wrap" id="modelos">
        <Reveal className="section-heading">
          <div>
            <span className="eyebrow">UM PONTO DE PARTIDA. INFINITAS POSSIBILIDADES.</span>
            <h2>Encontre o seu próximo site.</h2>
            <p>Modelos pensados para o seu negócio. A identidade é toda sua.</p>
          </div>
          <Link href="/modelos" className="text-link">
            Ver todos os modelos <Layers3 size={16} />
          </Link>
        </Reveal>
        <div className="home-category-tags">
          {['Institucionais', 'Restaurantes', 'Portfólios', 'Lojas virtuais', 'Tecnologia'].map(
            (c) => (
              <Link
                key={c}
                href={`/modelos?categoria=${data.categories.find((x) => x.name === c)?.slug || ''}`}
              >
                {c}
              </Link>
            ),
          )}
        </div>
        <div className="template-grid">
          {featured.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              category={data.categories.find((c) => c.id === t.category_id)?.name}
            />
          ))}
        </div>
        {data.error && (
          <p className="notice">
            O catálogo está temporariamente indisponível. Tente novamente em instantes.
          </p>
        )}
        <p className="section-footnote">
          Modelos demonstrativos. Cada projeto é desenvolvido individualmente após aprovação.
        </p>
      </section>
      <section className="section process-section" id="como-funciona">
        <div className="wrap">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">DA PRIMEIRA IDEIA AO PRÓXIMO PASSO</span>
              <h2>
                Simples para você.
                <br />
                <span className="muted">Cuidado em cada etapa.</span>
              </h2>
            </div>
            <p>
              Você traz a visão. Nós cuidamos de transformar
              <br className="desktop-break" /> os detalhes em uma experiência completa.
            </p>
          </Reveal>
          <div className="process-grid">
            {[
              [
                MousePointer2,
                'Escolha seu modelo',
                'Encontre o estilo e o tipo de site que combinam com seu negócio.',
              ],
              [
                Palette,
                'Deixe com a sua cara',
                'Explore cores, textos e imagens no estúdio, com prévia ao vivo.',
              ],
              [
                MessagesSquare,
                'Conte sua ideia',
                'Envie seu projeto para análise e receba uma proposta sob medida.',
              ],
              [
                ShieldCheck,
                'Aprove com confiança',
                'Confira o escopo e o prazo. O Pix só é liberado após sua aprovação.',
              ],
              [
                Code2,
                'Veja tomar forma',
                'Acompanhe o desenvolvimento e converse direto com o estúdio.',
              ],
              [
                Sparkles,
                'Prepare o próximo passo',
                'Revise os detalhes e receba seu site pronto para uma nova fase.',
              ],
            ].map(([Icon, title, description]) => (
              <div className="process-card" key={String(title)}>
                <span className="process-icon">
                  {typeof Icon !== 'string' && <Icon size={23} />}
                </span>
                <h3>{String(title)}</h3>
                <p>{String(description)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap benefits">
        <Reveal>
          <span className="eyebrow">UM SITE QUE TRABALHA PELO SEU NEGÓCIO</span>
          <h2>
            Bonito por fora.
            <br />
            Bem pensado por dentro.
          </h2>
          <p>
            Uma presença profissional começa com boas escolhas. Da primeira tela ao último detalhe.
          </p>
          <Link className="button button-outline" href="/modelos">
            Conhecer possibilidades
          </Link>
        </Reveal>
        <div className="benefits-grid">
          {[
            [Palette, 'Identidade própria', 'Design alinhado ao seu posicionamento.'],
            [Smartphone, 'Em qualquer tela', 'Uma experiência fluida em todos os dispositivos.'],
            [Search, 'Pronto para ser encontrado', 'Estrutura e boas práticas de SEO.'],
            [Code2, 'Desenvolvimento cuidadoso', 'Código organizado e foco em desempenho.'],
            [MessagesSquare, 'Conversa de verdade', 'Atendimento próximo durante todo o projeto.'],
            [Plus, 'Além do convencional', 'Solicite integrações e recursos específicos.'],
          ].map(([Icon, title, description]) => (
            <article key={String(title)}>
              {typeof Icon !== 'string' && <Icon size={20} />}
              <h3>{String(title)}</h3>
              <p>{String(description)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section wrap showcase">
        {works.length > 0 && (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">IDEIAS QUE GANHARAM FORMA</span>
                <h2>Projetos realizados.</h2>
                <p>Trabalhos entregues e publicados com autorização.</p>
              </div>
            </div>
            <div className="portfolio-grid">
              {works.map((work) => (
                <article className="portfolio-item" key={work.id}>
                  <Image
                    src={work.image}
                    alt={work.title}
                    width={600}
                    height={400}
                    sizes="(max-width:680px) 100vw, 33vw"
                  />
                  <div>
                    <h3>{work.title}</h3>
                    <p>{work.description}</p>
                    {work.url && (
                      <a
                        href={work.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link"
                      >
                        Visitar projeto
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        <div className="section-heading">
          <div>
            <span className="eyebrow">ESPAÇO PARA HISTÓRIAS REAIS</span>
            <h2>O próximo projeto pode ser o seu.</h2>
            <p>
              Os sites exibidos são conceitos demonstrativos do catálogo.
              <br />
              Projetos entregues e depoimentos reais serão publicados com autorização.
            </p>
          </div>
          <Monitor size={42} strokeWidth={1} />
        </div>
        {reviews.length > 0 ? (
          <div className="review-grid">
            {reviews.map((r) => (
              <blockquote key={r.id}>
                <p>“{r.body}”</p>
                <footer>
                  {r.name} · {r.company}
                  {r.demo && <span className="badge">Conteúdo demonstrativo</span>}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="empty-review">
            <MessagesSquare size={22} />
            <p>
              Boas parcerias constroem boas histórias.
              <span>Este espaço está reservado para depoimentos reais.</span>
            </p>
            <span className="badge">Sem avaliações fictícias</span>
          </div>
        )}
      </section>
      <section className="section wrap faq-section" id="perguntas">
        <div>
          <span className="eyebrow">ANTES DE COMEÇAR</span>
          <h2>
            Algumas boas
            <br />
            perguntas.
          </h2>
          <p>Transparência do primeiro clique à entrega.</p>
        </div>
        <div className="faq-list">
          {[
            [
              'O estúdio cria o meu site automaticamente?',
              'O estúdio oferece uma prévia visual da sua ideia. O site final será desenvolvido por um profissional, depois da análise e aprovação da proposta.',
            ],
            [
              'Quanto custa um site?',
              'Cada projeto tem um escopo diferente. Você personaliza um modelo, envia os detalhes e recebe uma proposta com preço, prazo e condições antes de pagar.',
            ],
            [
              'Posso pedir algo que não está nos modelos?',
              'Sim. Use o campo de funcionalidades especiais no estúdio para descrever integrações, páginas e outras ideias. Tudo será considerado na análise.',
            ],
            [
              'Como funciona o pagamento?',
              'Após aprovar a proposta, você acessa a chave Pix na área do projeto. O comprovante é enviado de forma privada e a confirmação do recebimento é manual.',
            ],
            [
              'Consigo salvar e continuar depois?',
              'Sim. O estúdio salva um rascunho neste dispositivo. Com sua conta, você também pode salvar no banco e continuar em outros dispositivos.',
            ],
            [
              'O meu site vai funcionar no celular?',
              'A experiência responsiva faz parte do projeto. No estúdio você pode conferir a prévia em desktop, tablet e celular.',
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <Plus size={17} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="wrap">
        <Reveal className="cta-panel">
          <span className="eyebrow">SUA IDEIA MERECE ESSE PRÓXIMO PASSO</span>
          <h2>
            Vamos construir algo
            <br />
            <span>com a sua essência?</span>
          </h2>
          <p>Comece com um modelo. Termine com uma presença única.</p>
          <Link className="button" href="/modelos">
            <Sparkles size={17} /> Criar meu site
          </Link>
          <span className="cta-note">Explore e personalize antes de solicitar seu orçamento.</span>
        </Reveal>
      </section>
    </main>
  );
}
