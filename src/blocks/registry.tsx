import type { ComponentType } from 'react';

import ContactAddressHours from '@/blocks/contact/address-hours';
import ContactFormAndMap from '@/blocks/contact/form-and-map';
import FaqAccordionFlat from '@/blocks/faq/accordion-flat';
import FaqTwoCol from '@/blocks/faq/two-col';
import FeaturesBento from '@/blocks/features/bento';
import FeaturesThreeColIcons from '@/blocks/features/three-col-icons';
import FooterMinimal from '@/blocks/footer/minimal';
import FooterThreeCol from '@/blocks/footer/three-col';
import HeroCentered from '@/blocks/hero/centered';
import HeroSplitImageRight from '@/blocks/hero/split-image-right';
import TestimonialsSingleQuote from '@/blocks/testimonials/single-quote';
import TestimonialsThreeCol from '@/blocks/testimonials/three-col';
import type { SectionType, VariantOf } from '@/lib/builder/catalog';

/**
 * Registry de componentes del builder.
 *
 * Único punto donde los 12 componentes se mapean a (type, variant).
 * Si añades una variante nueva:
 *   1. Crea el componente en src/blocks/{type}/{variant}.tsx
 *   2. Añade la variante a VARIANTS_BY_TYPE en lib/builder/catalog.ts
 *   3. Si tiene props nuevos, actualiza el schema en lib/builder/schemas/
 *   4. Regístralo aquí
 *   5. Versiona el system prompt del agente
 */

type BlockComponent = ComponentType<{ id: string; props: Record<string, unknown> }>;

type Registry = {
  [T in SectionType]: { [V in VariantOf<T>]: BlockComponent };
};

export const blockRegistry: Registry = {
  hero: {
    centered: HeroCentered,
    'split-image-right': HeroSplitImageRight,
  },
  features: {
    'three-col-icons': FeaturesThreeColIcons,
    bento: FeaturesBento,
  },
  testimonials: {
    'single-quote': TestimonialsSingleQuote,
    'three-col': TestimonialsThreeCol,
  },
  contact: {
    'address-hours': ContactAddressHours,
    'form-and-map': ContactFormAndMap,
  },
  faq: {
    'accordion-flat': FaqAccordionFlat,
    'two-col': FaqTwoCol,
  },
  footer: {
    minimal: FooterMinimal,
    'three-col': FooterThreeCol,
  },
};
