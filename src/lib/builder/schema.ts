import { z } from 'zod';

import {
  isValidType,
  isValidVariant,
  SECTION_TYPES,
} from '@/lib/builder/catalog';
import { PROPS_SCHEMAS } from '@/lib/builder/schemas';

/**
 * Validación runtime del JSON completo del sitio.
 *
 * El schema de section delega los props al schema específico del tipo
 * via PROPS_SCHEMAS — así un (type, variant) inválido o un props con
 * la forma equivocada se rechaza con un error preciso que el agente
 * puede entender en el tool_result y reintentar.
 */

const sectionTypeSchema = z.enum(
  SECTION_TYPES as unknown as [string, ...string[]]
);

export const sectionSchema = z
  .object({
    id: z.string().min(1),
    type: sectionTypeSchema,
    variant: z.string().min(1),
    props: z.unknown(),
  })
  .superRefine((section, ctx) => {
    if (!isValidType(section.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['type'],
        message: `Tipo "${section.type}" no existe en el catálogo.`,
      });
      return;
    }
    if (!isValidVariant(section.type, section.variant)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['variant'],
        message: `Variante "${section.variant}" no existe para tipo "${section.type}".`,
      });
      return;
    }
    // Valida los props con el schema específico del tipo
    const propsSchema = PROPS_SCHEMAS[section.type];
    const result = propsSchema.safeParse(section.props);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['props', ...err.path],
          message: err.message,
        });
      });
    }
  });

export const pageSchema = z.object({
  slug: z.string(),
  metadata: z.object({
    title: z.string().max(60),
    description: z.string().max(160),
    favicon: z.string().url().optional(),
  }),
  sections: z.array(sectionSchema),
});

export const themeSchema = z.object({
  accent: z.enum([
    'warm-bone',
    'pale-blue',
    'pale-green',
    'pale-yellow',
    'pale-red',
  ]),
  headingFont: z.literal('instrument-serif'),
  bodyFont: z.literal('geist-sans'),
});

export const siteContentSchema = z.object({
  version: z.literal(1),
  theme: themeSchema,
  pages: z.array(pageSchema).min(1),
});

export type ParsedSiteContent = z.infer<typeof siteContentSchema>;
