import { z } from 'zod';
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor hexadecimal válida.');
const short = z.string().trim().max(200);
const image = z
  .string()
  .max(250)
  .refine(
    (v) =>
      !v ||
      /^\/images\/[a-z-]+\.(svg|webp)$/.test(v) ||
      /^\/api\/files\/[0-9a-f-]{36}\?inline=1$/.test(v) ||
      /^\/api\/catalog-assets\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(v),
    'Imagem inválida.',
  );
export const configSchema = z
  .object({
    version: z.literal(1),
    company: short.min(1, 'Informe o nome.'),
    slogan: short,
    primary: color,
    secondary: color,
    background: color,
    buttonColor: color,
    textColor: color.optional(),
    highlight: color.optional(),
    font: z.enum(['sans', 'serif', 'mono']),
    radius: z.number().int().min(0).max(32),
    title: short.min(1, 'Informe o título.'),
    subtitle: short,
    description: z.string().max(4000),
    services: z.array(short).max(20),
    email: z.union([z.email(), z.literal('')]),
    phone: z.string().max(30),
    address: z.string().max(500),
    instagram: z.string().max(100),
    cta: short,
    logo: image,
    heroImage: image,
    images: z.array(image).max(12),
    sections: z
      .array(z.enum(['sobre', 'servicos', 'galeria', 'depoimentos', 'equipe', 'faq', 'contato']))
      .max(7),
    features: z.array(short).max(30),
    pages: z.number().int().min(1).max(100),
    notes: z.string().max(8000),
  })
  .strict();
const localImage = z.union([image, z.string().regex(/^local-image:[0-9a-f-]{36}$/)]);
// Only the browser-local editor accepts image identifiers; the server schema never does.
export const localConfigSchema = configSchema.extend({
  logo: localImage,
  heroImage: localImage,
  images: z.array(localImage).max(12),
});
export const briefSchema = z
  .object({
    name: short.min(3, 'Informe seu nome completo.'),
    company: short.min(1),
    email: z.email('E-mail inválido.'),
    phone: z.string().regex(/^[+\d\s()\-]{10,25}$/, 'Informe um WhatsApp válido.'),
    purpose: z
      .string()
      .trim()
      .min(10, 'Descreva o objetivo em pelo menos 10 caracteres.')
      .max(4000),
    deadline: short.min(1, 'Informe o prazo desejado.'),
    budget: short,
    domain: short,
    hosting: short.min(1),
    additional: z.string().max(8000),
    consent: z.literal(true, { error: 'Autorize o tratamento dos dados para o orçamento.' }),
  })
  .strict();
const uuid = z.uuid();
export const commandSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('whatsapp'),
    payload: z
      .object({
        phone: z.string().regex(/^(55\d{10,11})?$/, 'Use 55, DDD e número, sem símbolos.'),
        message: z.string().trim().min(1).max(1000),
        enabled: z.boolean(),
      })
      .refine((p) => !p.enabled || !!p.phone, 'Cadastre um número válido antes de ativar.'),
  }),
  z.object({
    action: z.literal('portfolio'),
    payload: z.object({
      id: uuid,
      title: short.min(2),
      description: z.string().min(10).max(2000),
      image: image.min(1),
      url: z.union([z.url().refine((v) => v.startsWith('https://')), z.literal('')]),
      active: z.boolean(),
      authorized: z.literal(true),
    }),
  }),
  z.object({
    action: z.literal('save_draft'),
    payload: z.object({ id: uuid, template_id: uuid, config: configSchema }),
  }),
  z.object({ action: z.literal('submit'), payload: z.object({ id: uuid, brief: briefSchema }) }),
  z.object({
    action: z.literal('send_quote'),
    payload: z.object({
      id: uuid,
      amount: z.number().int().min(100).max(100000000),
      deadline: short.min(1),
      scope: z.string().min(10).max(8000),
      terms: z.string().min(3).max(4000),
      notes: z.string().max(4000),
    }),
  }),
  z.object({
    action: z.enum([
      'approve_quote',
      'decline_quote',
      'confirm_payment',
      'payment_pending',
      'cancel',
      'read_messages',
    ]),
    payload: z.object({ id: uuid }),
  }),
  z.object({
    action: z.literal('set_status'),
    payload: z.object({
      id: uuid,
      status: z.enum([
        'analysis',
        'needs_information',
        'awaiting_approval',
        'development',
        'revision',
        'completed',
        'delivered',
        'rejected',
        'cancelled',
      ]),
      note: z.string().max(4000),
    }),
  }),
  z.object({
    action: z.literal('message'),
    payload: z.object({ id: uuid, body: z.string().trim().min(1).max(4000) }),
  }),
  z.object({ action: z.literal('read_notifications'), payload: z.object({}) }),
  z.object({
    action: z.literal('settings'),
    payload: z.object({
      key: short.min(1),
      beneficiary: short.min(1),
      bank: short.min(1),
      instructions: z.string().max(4000),
      key_type: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional(),
    }),
  }),
  z.object({
    action: z.literal('category'),
    payload: z.object({
      id: uuid,
      slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
      name: short.min(2),
      description: z.string().max(1000),
      active: z.boolean(),
    }),
  }),
  z.object({
    action: z.literal('template'),
    payload: z.object({
      id: uuid,
      slug: z.string().regex(/^[a-z0-9-]{2,100}$/),
      name: short.min(2),
      category_id: uuid,
      style: z.enum(['minimalista', 'moderno', 'elegante', 'premium']),
      description: z.string().max(1000),
      accent: color,
      featured: z.boolean(),
      active: z.boolean(),
      content: z
        .record(z.string(), z.string().max(2000))
        .refine(
          (c) =>
            (!c.tier || ['premium', 'conventional'].includes(c.tier)) &&
            (!c.basePriceCents ||
              (/^\d+$/.test(c.basePriceCents) &&
                Number(c.basePriceCents) >= 100 &&
                Number(c.basePriceCents) <= 100000000)),
          'Classificação ou preço-base inválido.',
        ),
    }),
  }),
  z.object({
    action: z.literal('testimonial'),
    payload: z.object({
      id: uuid,
      name: short.min(2),
      company: short,
      body: z.string().min(10).max(2000),
      demo: z.boolean(),
      active: z.boolean(),
    }),
  }),
]);
export type Command = z.infer<typeof commandSchema>;
