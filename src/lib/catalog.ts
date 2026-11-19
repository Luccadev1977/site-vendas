import type { Category, SiteConfig, Style, Template } from './domain';

const niches = [
  [
    'institucional',
    'Institucionais',
    'Aurora',
    'Uma nova perspectiva para sua empresa.',
    'Estratégia,Consultoria,Soluções',
  ],
  [
    'advocacia',
    'Advocacia',
    'Vértice Legal',
    'Clareza para decisões importantes.',
    'Direito empresarial,Direito civil,Consultoria jurídica',
  ],
  [
    'restaurantes',
    'Restaurantes',
    'Oliva',
    'À mesa, o tempo ganha outro sabor.',
    'Menu da estação,Experiências,Reservas',
  ],
  [
    'barbearias',
    'Barbearias',
    'Distrito',
    'Seu estilo. Sua assinatura.',
    'Corte,Barba,Experiência completa',
  ],
  [
    'clinicas',
    'Clínicas',
    'Essentia',
    'Cuidar de você faz parte de nós.',
    'Especialidades,Exames,Atendimento integrado',
  ],
  [
    'odontologia',
    'Odontologia',
    'Lume',
    'Um sorriso abre novos caminhos.',
    'Prevenção,Estética,Reabilitação',
  ],
  [
    'imobiliarias',
    'Imobiliárias',
    'Habita',
    'O próximo capítulo começa em casa.',
    'Imóveis,Locação,Avaliação',
  ],
  [
    'lojas',
    'Lojas virtuais',
    'Forma',
    'Objetos para viver com intenção.',
    'Coleção,Casa,Acessórios',
  ],
  [
    'portfolios',
    'Portfólios',
    'Alex Morgan',
    'Ideias que merecem sair do papel.',
    'Design,Direção criativa,Projetos',
  ],
  [
    'landing-pages',
    'Landing pages',
    'Impulso',
    'Sua próxima grande ideia começa aqui.',
    'Descubra,Experimente,Transforme',
  ],
  [
    'academias',
    'Academias',
    'Pulse',
    'O movimento transforma tudo.',
    'Musculação,Funcional,Acompanhamento',
  ],
  [
    'tecnologia',
    'Tecnologia',
    'Orbit',
    'O futuro funciona melhor conectado.',
    'Software,Cloud,Integrações',
  ],
  [
    'autonomos',
    'Autônomos',
    'Singular',
    'Um trabalho com a sua essência.',
    'Consultoria,Projetos,Atendimento',
  ],
  [
    'personalizados',
    'Personalizados',
    'Canvas',
    'Uma ideia única merece um site único.',
    'Descoberta,Criação,Desenvolvimento',
  ],
] as const;
export const styles: Style[] = ['minimalista', 'moderno', 'premium'];
export const categories: Category[] = niches.map(([slug, name], index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  slug,
  name,
  description: `Sites para ${name.toLowerCase()}`,
  active: true,
}));
const accents = ['#a9bf9d', '#6797ff', '#cda977'];
export const templates: Template[] = niches.flatMap(([slug, , brand, title, services], index) =>
  styles.map((style, s) => ({
    id: `10000000-0000-4000-8000-${String(index * 3 + s + 1).padStart(12, '0')}`,
    slug: `${slug}-${style}`,
    name: `${brand} ${['Essencial', 'Studio', 'Signature'][s]}`,
    category_id: categories[index].id,
    style,
    description: title,
    accent: accents[s],
    featured: (index === 0 && s === 1) || (index === 2 && s === 2) || (index === 8 && s === 0),
    active: true,
    content: {
      company: brand,
      title,
      services,
      slogan: ['Essência em cada detalhe.', 'Feito para ir além.', 'Uma experiência singular.'][s],
    },
  })),
);
export function defaultConfig(template: Template): SiteConfig {
  return {
    version: 1,
    company: template.content.company || template.name,
    slogan: template.content.slogan || 'Feito com propósito.',
    primary: template.accent,
    secondary:
      template.content.secondary || (template.style === 'minimalista' ? '#687363' : '#a7b2c8'),
    background:
      template.content.background || (template.style === 'minimalista' ? '#f3f1ec' : '#11151b'),
    buttonColor: template.content.buttonColor || template.accent,
    font: template.style === 'premium' ? 'serif' : 'sans',
    radius: template.style === 'moderno' ? 18 : 2,
    title: template.content.title || template.description,
    subtitle: 'Conheça uma nova forma de fazer acontecer.',
    description:
      'Uma abordagem atenciosa, soluções feitas para você e cuidado em cada detalhe. Conte a sua história aqui.',
    services: (template.content.services || 'Estratégia,Criação,Execução').split(','),
    email: '',
    phone: '',
    address: '',
    instagram: '',
    cta: 'Vamos conversar',
    logo: '',
    heroImage: template.content.heroImage || '/images/architecture.svg',
    images: [],
    sections: ['sobre', 'servicos', 'contato'],
    features: ['formulario', 'whatsapp'],
    pages: 1,
    notes: '',
  };
}
