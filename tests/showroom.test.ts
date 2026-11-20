import { describe, it, expect } from 'vitest';
import {
  categories,
  seedTemplates as templates,
  isPremium,
  defaultConfig,
  basePrice,
} from '../src/lib/catalog';
import { templates as legacy } from '../src/lib/legacy-catalog';
import { demoTemplates } from '../src/lib/template-routes';
import { editorHistory } from '../src/lib/editor-history';
import { configSchema, localConfigSchema, commandSchema } from '../src/lib/validation';
describe('Showroom catalog and editor integrity', () => {
  it('contains exactly 39 conventional and 3 exclusive premium models across 13 niches', () => {
    expect(templates).toHaveLength(42);
    expect(new Set(templates.map((t) => t.slug)).size).toBe(42);
    expect(new Set(templates.map((t) => t.name)).size).toBe(42);
    expect(new Set(templates.map((t) => t.id)).size).toBe(42);
    expect(categories).toHaveLength(13);
    expect(templates.filter(isPremium).map((t) => t.name)).toEqual([
      'Luxury Business',
      'Digital Experience',
      'Signature Commerce',
    ]);
    for (const category of categories) {
      const conventional = templates.filter((t) => t.category_id === category.id && !isPremium(t));
      expect(conventional).toHaveLength(3);
      expect(conventional.map((t) => t.style)).toEqual(['minimalista', 'moderno', 'elegante']);
      expect(new Set(conventional.map((t) => t.content.layout)).size).toBe(3);
    }
    expect(new Set(templates.filter(isPremium).map((t) => t.content.layout)).size).toBe(3);
  });
  it('keeps every previous demo link and makes no invented prices', () => {
    for (const old of legacy) expect(demoTemplates.some((t) => t.slug === old.slug)).toBe(true);
    for (const t of templates) expect(basePrice(t)).toBeNull();
  });
  it('undoes, redoes and clears redo history after a new change', () => {
    const initial = defaultConfig(templates[0]);
    let state = { past: [], present: initial, future: [] } as Parameters<typeof editorHistory>[0];
    state = editorHistory(state, {
      type: 'change',
      value: { ...initial, company: 'Minha empresa' },
    });
    state = editorHistory(state, { type: 'undo' });
    expect(state.present.company).toBe(initial.company);
    state = editorHistory(state, { type: 'redo' });
    expect(state.present.company).toBe('Minha empresa');
    state = editorHistory(state, { type: 'undo' });
    state = editorHistory(state, { type: 'change', value: { ...initial, title: 'Outra ideia' } });
    expect(state.future).toHaveLength(0);
    expect(state.present.title).toBe('Outra ideia');
  });
  it('bounds history and resets it when loading an external draft', () => {
    let state = { past: [], present: defaultConfig(templates[0]), future: [] } as Parameters<
      typeof editorHistory
    >[0];
    for (let i = 0; i < 100; i++)
      state = editorHistory(state, {
        type: 'change',
        value: (c) => ({ ...c, company: String(i) }),
      });
    expect(state.past).toHaveLength(80);
    state = editorHistory(state, { type: 'load', value: defaultConfig(templates[1]) });
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
  });
  it('permits local image references only in the browser schema', () => {
    const c = {
      ...defaultConfig(templates[0]),
      heroImage: 'local-image:20000000-0000-4000-8000-000000000001',
    };
    expect(localConfigSchema.safeParse(c).success).toBe(true);
    expect(configSchema.safeParse(c).success).toBe(false);
    expect(
      commandSchema.safeParse({
        action: 'save_draft',
        payload: {
          id: '20000000-0000-4000-8000-000000000001',
          template_id: templates[0].id,
          config: c,
        },
      }).success,
    ).toBe(false);
  });
  it('accepts all seven safe sections but rejects injected color and unknown structural keys', () => {
    const c = {
      ...defaultConfig(templates[0]),
      sections: ['sobre', 'servicos', 'galeria', 'equipe', 'depoimentos', 'faq', 'contato'],
    };
    expect(configSchema.safeParse(c).success).toBe(true);
    expect(configSchema.safeParse({ ...c, highlight: 'url(javascript:evil)' }).success).toBe(false);
    expect(configSchema.safeParse({ ...c, sections: ['checkout-script'] }).success).toBe(false);
  });
});
