import 'server-only';

import { siteContentSchema, type ParsedSiteContent } from '@/lib/builder/schema';

import blankRaw from './blank.json';
import portfolioRaw from './portfolio-minimal.json';
import restaurantRaw from './restaurant-cafe.json';
import servicesRaw from './services-warm.json';

/**
 * Loader tipado de templates.
 *
 * Cada template se valida al boot del módulo con el siteContentSchema.
 * Si un template tiene un error en su JSON, la app falla en arranque
 * con un mensaje claro — preferible a fallar en runtime cuando un
 * usuario lo aplica.
 */

export const TEMPLATE_IDS = [
  'portfolio-minimal',
  'services-warm',
  'restaurant-cafe',
  'blank',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

const RAW_TEMPLATES: Record<TemplateId, unknown> = {
  'portfolio-minimal': portfolioRaw,
  'services-warm': servicesRaw,
  'restaurant-cafe': restaurantRaw,
  blank: blankRaw,
};

const TEMPLATES: Record<TemplateId, ParsedSiteContent> = (() => {
  const validated: Partial<Record<TemplateId, ParsedSiteContent>> = {};
  for (const id of TEMPLATE_IDS) {
    const result = siteContentSchema.safeParse(RAW_TEMPLATES[id]);
    if (!result.success) {
      throw new Error(
        `[templates] El template "${id}" tiene un JSON inválido: ${JSON.stringify(
          result.error.flatten(),
          null,
          2
        )}`
      );
    }
    validated[id] = result.data;
  }
  return validated as Record<TemplateId, ParsedSiteContent>;
})();

/**
 * Devuelve un template por ID. El JSON está pre-validado.
 *
 * NOTA: devolvemos un clone profundo cada vez para que el caller pueda
 * modificarlo sin contaminar el template base. JSON-stringify+parse es
 * suficiente: el contenido es JSON válido y pequeño (<5KB).
 */
export function getTemplate(id: TemplateId): ParsedSiteContent {
  const tpl = TEMPLATES[id];
  return JSON.parse(JSON.stringify(tpl)) as ParsedSiteContent;
}

export function isValidTemplateId(id: string): id is TemplateId {
  return (TEMPLATE_IDS as ReadonlyArray<string>).includes(id);
}
