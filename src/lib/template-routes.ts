import { templates } from './catalog';
import { templates as legacy } from './legacy-catalog';
// Old links remain navigable without adding archived entries to the 42-item catalog.
export const demoTemplates = [
  ...templates,
  ...legacy.filter((t) => !templates.some((current) => current.slug === t.slug)),
];
export function routeTemplate(slug: string) {
  return demoTemplates.find((t) => t.slug === slug);
}
