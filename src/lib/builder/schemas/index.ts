/**
 * Barrel de schemas de bloques.
 *
 * Importa así desde el resto del código:
 *   import { heroPropsSchema, type HeroProps } from '@/lib/builder/schemas';
 */

export { heroPropsSchema, type HeroProps } from './hero';
export { featuresPropsSchema, type FeaturesProps } from './features';
export {
  testimonialsPropsSchema,
  type TestimonialsProps,
} from './testimonials';
export { contactPropsSchema, type ContactProps } from './contact';
export { faqPropsSchema, type FaqProps } from './faq';
export { footerPropsSchema, type FooterProps } from './footer';

import { contactPropsSchema } from './contact';
import { faqPropsSchema } from './faq';
import { featuresPropsSchema } from './features';
import { footerPropsSchema } from './footer';
import { heroPropsSchema } from './hero';
import { testimonialsPropsSchema } from './testimonials';

import type { SectionType } from '@/lib/builder/catalog';
import type { ZodTypeAny } from 'zod';

/**
 * Map type → schema. Usado por:
 *   - operations.ts para validar antes de aplicar cambios del agente
 *   - render.tsx para validar antes de pintar (defense in depth)
 */
export const PROPS_SCHEMAS: Record<SectionType, ZodTypeAny> = {
  hero: heroPropsSchema,
  features: featuresPropsSchema,
  testimonials: testimonialsPropsSchema,
  contact: contactPropsSchema,
  faq: faqPropsSchema,
  footer: footerPropsSchema,
};
