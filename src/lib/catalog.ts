import type { Category, SiteConfig, Style, Template } from './domain';
import settings from '../../public/catalog-settings.json' with { type: 'json' };
export const niches = [
  [
    'advocacia',
    'Advocacia',
    'Vértice',
    'Clareza para decisões importantes.',
    'Direito empresarial,Direito civil,Consultoria jurídica',
    'law',
    '#786450',
    'Escritórios de advocacia',
  ],
  [
    'restaurantes',
    'Restaurantes',
    'Oliva',
    'O tempo ganha outro sabor.',
    'Menu da estação,Mesa do chef,Carta de vinhos',
    'restaurant',
    '#a85e3b',
    'Cozinha autoral e ingredientes da estação',
  ],
  [
    'barbearias',
    'Barbearias',
    'Distrito',
    'Seu estilo. Sua assinatura.',
    'Corte clássico,Barba,Acabamento',
    'barber',
    '#c59659',
    'Cuidado e expressão pessoal',
  ],
  [
    'clinicas',
    'Clínicas médicas',
    'Essentia',
    'Cuidado que começa na escuta.',
    'Clínica geral,Especialidades,Prevenção',
    'clinic',
    '#307d7d',
    'Uma perspectiva humana sobre saúde',
  ],
  [
    'odontologia',
    'Odontologia',
    'Lume',
    'Um sorriso abre novos caminhos.',
    'Prevenção,Estética,Reabilitação',
    'dental',
    '#528a99',
    'Bem-estar em cada detalhe',
  ],
  [
    'imobiliarias',
    'Imobiliárias',
    'Habita',
    'Encontre seu próximo capítulo.',
    'Casas,Apartamentos,Espaços comerciais',
    'realty',
    '#696f45',
    'Lugares para viver novas histórias',
  ],
  [
    'lojas',
    'Lojas virtuais',
    'Forma',
    'Objetos para viver com intenção.',
    'Coleção Essencial,Objetos,Casa',
    'commerce',
    '#a06248',
    'Design para o cotidiano',
  ],
  [
    'portfolios',
    'Portfólios profissionais',
    'Alex Morgan',
    'Ideias que merecem sair do papel.',
    'Identidade,Direção de arte,Projetos digitais',
    'portfolio',
    '#7065a5',
    'Designer independente · Projetos selecionados',
  ],
  [
    'academias',
    'Academias',
    'Pulse',
    'Encontre a sua próxima versão.',
    'Treino de força,Funcional,Mobilidade',
    'fitness',
    '#adfa56',
    'Movimento com propósito',
  ],
  [
    'tecnologia',
    'Empresas de tecnologia',
    'Orbit',
    'Boas ideias merecem tecnologia.',
    'Plataforma,Cloud,Integrações',
    'technology',
    '#7192ff',
    'Sistemas que conectam possibilidades',
  ],
  [
    'escolas',
    'Escolas e cursos',
    'Horizonte',
    'Aprender muda a perspectiva.',
    'Design,Tecnologia,Comunicação',
    'education',
    '#e7a93c',
    'Conhecimento para ir além',
  ],
  [
    'arquitetura',
    'Arquitetura e decoração',
    'Traço',
    'Espaços que fazem sentir.',
    'Residencial,Interiores,Comercial',
    'architecture',
    '#a17c5f',
    'Arquitetura, matéria e significado',
  ],
  [
    'institucional',
    'Empresas e negócios',
    'Aurora',
    'Uma nova perspectiva para sua empresa.',
    'Estratégia,Consultoria,Soluções',
    'business',
    '#61857b',
    'Conexões que transformam negócios',
  ],
] as const;
const oldCategoryNumbers: Record<string, number> = {
  institucional: 1,
  advocacia: 2,
  restaurantes: 3,
  barbearias: 4,
  clinicas: 5,
  odontologia: 6,
  imobiliarias: 7,
  lojas: 8,
  portfolios: 9,
  academias: 11,
  tecnologia: 12,
  escolas: 15,
  arquitetura: 16,
};
export const styles: Style[] = ['minimalista', 'moderno', 'elegante'];
export const styleLabels: Record<Style, string> = {
  minimalista: 'Minimalista',
  moderno: 'Moderno',
  elegante: 'Elegante',
  premium: 'Elegante (legado)',
};
export const categories: Category[] = niches.map(([slug, name]) => ({
  id: `00000000-0000-4000-8000-${String(oldCategoryNumbers[slug]).padStart(12, '0')}`,
  slug,
  name,
  description: `Sites para ${name.toLowerCase()}`,
  active: true,
}));
export const templates: Template[] = niches.flatMap(
  ([slug, , brand, title, services, scene, accent, subtitle], i) =>
    styles.map((style, s) => ({
      id: `11000000-0000-4000-8000-${String(i * 3 + s + 1).padStart(12, '0')}`,
      slug: `${slug}-${style}`,
      name: `${brand} ${['Essencial', 'Studio', 'Atelier'][s]}`,
      category_id: categories[i].id,
      style,
      description: title,
      accent,
      featured:
        (slug === 'restaurantes' && s === 2) ||
        (slug === 'arquitetura' && s === 0) ||
        (slug === 'tecnologia' && s === 1),
      active: true,
      content: {
        company: brand,
        title,
        services,
        slogan: subtitle,
        subtitle,
        scene,
        tier: 'conventional',
        basePriceCents: '',
        heroImage: `/images/showroom-${scene}.webp`,
        layout: ['quiet', 'split', 'editorial'][s],
        background:
          s === 0 ? '#f4f4ef' : s === 1 ? (scene === 'fitness' ? '#141a13' : '#131b22') : '#eae5db',
        secondary: s === 1 ? '#b2bec9' : '#6f766f',
        cta:
          scene === 'commerce'
            ? 'Explorar coleção'
            : scene === 'restaurant'
              ? 'Conhecer o menu'
              : scene === 'portfolio' || scene === 'architecture'
                ? 'Ver projetos'
                : 'Conhecer possibilidades',
      },
    })),
);
const premiumDefinitions = [
  [
    'luxury-business',
    'Luxury Business',
    'institucional',
    'Maison & Co.',
    'Visão, presença e permanência.',
    'business',
    '#c4a57d',
    'luxury',
    'Estratégia executiva,Presença global,Legado',
    '#191b18',
  ],
  [
    'digital-experience',
    'Digital Experience',
    'tecnologia',
    'NOVA / LAB',
    'O próximo não tem limites.',
    'technology',
    '#9cffce',
    'digital',
    'Inteligência de dados,Experiências imersivas,Sistemas conectados',
    '#0b1119',
  ],
  [
    'signature-commerce',
    'Signature Commerce',
    'lojas',
    'ÉDITIONS',
    'Extraordinário, todos os dias.',
    'commerce',
    '#916747',
    'signature',
    'Objetos de coleção,Matéria e textura,Novas edições',
    '#f4f0e8',
  ],
] as const;
for (const [
  i,
  [slug, name, category, company, title, scene, accent, layout, services, background],
] of premiumDefinitions.entries())
  templates.push({
    id: `11000000-0000-4000-8000-${String(40 + i).padStart(12, '0')}`,
    slug,
    name,
    category_id: categories.find((c) => c.slug === category)!.id,
    style: i === 1 ? 'moderno' : 'elegante',
    description: title,
    accent,
    featured: false,
    active: true,
    content: {
      company,
      title,
      slogan: 'THE NEXO SIGNATURE COLLECTION',
      subtitle:
        i === 1
          ? 'Tecnologia para possibilidades que ainda não existem.'
          : 'Uma seleção para quem reconhece o valor dos detalhes.',
      services,
      scene,
      tier: 'premium',
      layout,
      background,
      secondary: i === 2 ? '#756c61' : '#b1b6ac',
      heroImage: `/images/showroom-${scene}.webp`,
      basePriceCents: '',
      cta: i === 2 ? 'Descobrir a coleção' : 'Explorar a experiência',
    },
  });
export const seedTemplates = templates.map((t) => ({ ...t, content: { ...t.content } }));
// An administrator can export this public snapshot and publish it without editing source code.
for (const override of settings.templates as {
  id: string;
  tier: string;
  basePriceCents: string;
}[]) {
  const template = templates.find((t) => t.id === override.id);
  if (
    !template ||
    !['premium', 'conventional'].includes(override.tier) ||
    (override.basePriceCents &&
      (!/^[0-9]{1,9}$/.test(override.basePriceCents) ||
        Number(override.basePriceCents) < 100 ||
        Number(override.basePriceCents) > 100000000))
  )
    throw new Error('Configuração pública de catálogo inválida.');
  template.content = {
    ...template.content,
    tier: override.tier,
    basePriceCents: override.basePriceCents,
  };
}
export function isPremium(t: Template) {
  return t.content.tier === 'premium';
}
export function basePrice(t: Template): number | null {
  const value = t.content.basePriceCents;
  return value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;
}
const configuredConventional = templates
  .filter((t) => !isPremium(t) && basePrice(t) !== null)
  .map((t) => basePrice(t)!);
const configuredPremium = templates
  .filter((t) => isPremium(t) && basePrice(t) !== null)
  .map((t) => basePrice(t)!);
if (
  configuredConventional.length &&
  configuredPremium.length &&
  Math.min(...configuredPremium) <= Math.max(...configuredConventional)
)
  throw new Error('Os valores-base Premium devem superar os preços convencionais.');
export function defaultConfig(t: Template): SiteConfig {
  const light =
    t.style === 'minimalista' || (t.style === 'elegante' && t.content.layout !== 'luxury');
  return {
    version: 1,
    company: t.content.company || t.name,
    slogan: t.content.slogan || 'Feito com propósito.',
    primary: t.accent,
    secondary: t.content.secondary || (light ? '#65736c' : '#b2bec9'),
    background: t.content.background || (light ? '#f4f4ef' : '#131b22'),
    buttonColor: t.content.buttonColor || t.accent,
    textColor: light ? '#252b28' : '#f3f5f1',
    highlight: t.accent,
    font: t.style === 'elegante' || t.style === 'premium' ? 'serif' : 'sans',
    radius: t.style === 'moderno' ? 16 : 2,
    title: t.content.title || t.description,
    subtitle: t.content.subtitle || 'Conheça uma nova forma de fazer acontecer.',
    description: `${t.content.company || t.name} é uma marca fictícia criada para demonstrar este projeto. Explore ${t.content.services?.toLowerCase() || 'as possibilidades'} e imagine o seu negócio aqui.`,
    services: (t.content.services || 'Estratégia,Criação,Execução').split(','),
    email: '',
    phone: '',
    address: '',
    instagram: '',
    cta: t.content.cta || 'Vamos conversar',
    logo: '',
    heroImage: t.content.heroImage || '/images/architecture.svg',
    images: [],
    sections: ['sobre', 'servicos', 'galeria', 'contato'],
    features: ['formulario', 'whatsapp'],
    pages: 1,
    notes: '',
  };
}
