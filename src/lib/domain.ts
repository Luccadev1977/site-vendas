export const statuses = {
  draft: 'Rascunho',
  received: 'Solicitação recebida',
  analysis: 'Em análise',
  needs_information: 'Aguardando informações',
  proposal_sent: 'Proposta enviada',
  awaiting_approval: 'Aguardando aprovação do cliente',
  awaiting_payment: 'Aguardando pagamento',
  payment_review: 'Pagamento em verificação',
  development: 'Em desenvolvimento',
  revision: 'Em revisão',
  completed: 'Concluído',
  delivered: 'Entregue',
  rejected: 'Recusado',
  cancelled: 'Cancelado',
} as const;
export type Status = keyof typeof statuses;
export type Style = 'minimalista' | 'moderno' | 'elegante' | 'premium';
export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
};
export type Template = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  category_name?: string;
  style: Style;
  description: string;
  accent: string;
  featured: boolean;
  active: boolean;
  content: Record<string, string>;
};
export type SiteConfig = {
  version: 1;
  company: string;
  slogan: string;
  primary: string;
  secondary: string;
  background: string;
  buttonColor: string;
  textColor?: string;
  highlight?: string;
  font: 'sans' | 'serif' | 'mono';
  radius: number;
  title: string;
  subtitle: string;
  description: string;
  services: string[];
  email: string;
  phone: string;
  address: string;
  instagram: string;
  cta: string;
  logo: string;
  heroImage: string;
  images: string[];
  sections: string[];
  features: string[];
  pages: number;
  notes: string;
};
export type Brief = {
  name: string;
  company: string;
  email: string;
  phone: string;
  purpose: string;
  deadline: string;
  budget: string;
  domain: string;
  hosting: string;
  additional: string;
  consent: boolean;
};
export type Project = {
  id: string;
  number: string;
  client_id: string;
  template_id: string;
  template_snapshot: Template;
  name: string;
  status: Status;
  config: SiteConfig;
  brief: Brief | null;
  created_at: string;
  updated_at: string;
};
export type Quote = {
  id: string;
  project_id: string;
  amount: number;
  deadline: string;
  scope: string;
  terms: string;
  notes: string;
  status: 'sent' | 'approved' | 'declined';
  created_at: string;
};
export type Payment = {
  id: string;
  project_id: string;
  quote_id: string;
  amount: number;
  status: 'pending' | 'review' | 'confirmed';
  confirmed_at: string | null;
  created_at: string;
};
export type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
export type ProjectFile = {
  id: string;
  project_id: string;
  name: string;
  path: string;
  mime: string;
  size: number;
  purpose: 'asset' | 'attachment' | 'receipt' | 'message';
  created_at: string;
};
export type History = {
  id: string;
  project_id: string;
  status: Status;
  note: string;
  created_at: string;
};
export type Notification = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  read_at: string | null;
  created_at: string;
};
export type PixSettings = { key: string; beneficiary: string; bank: string; instructions: string };
export type Profile = { id: string; full_name: string; email: string; created_at: string };
export type Testimonial = {
  id: string;
  name: string;
  company: string;
  body: string;
  demo: boolean;
  active: boolean;
};
export type Portfolio = {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;
  active: boolean;
  authorized: boolean;
};
export type ProjectSummary = Pick<
  Project,
  | 'id'
  | 'number'
  | 'client_id'
  | 'template_id'
  | 'name'
  | 'status'
  | 'brief'
  | 'created_at'
  | 'updated_at'
>;
export type QuoteSummary = Pick<Quote, 'id' | 'project_id' | 'amount' | 'status' | 'created_at'>;
export type ClientProject = Omit<ProjectSummary, 'brief'> & { template_snapshot: Template };
export const money = (amount: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100);
export const date = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
export function businessMonth(value: string | number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).formatToParts(new Date(value));
  return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}`;
}
