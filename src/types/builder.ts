import type { SectionType, VariantOf } from '@/lib/builder/catalog';

/**
 * Modelo D — Lista de secciones tipadas con variantes y arrays homogéneos.
 *
 * El JSON de un sitio es serializable, validable con Zod, y compacto
 * (típicamente < 3 KB), por lo que cabe entero en el contexto del agente.
 */

export interface SiteContent {
  /** Versión del schema. Incrementa al hacer breaking changes. */
  version: 1;
  theme: SiteTheme;
  pages: SitePage[];
}

export interface SiteTheme {
  /** Acento pastel de la paleta de minimalist_ui. */
  accent: 'warm-bone' | 'pale-blue' | 'pale-green' | 'pale-yellow' | 'pale-red';
  /** Familia para titulares editoriales. */
  headingFont: 'instrument-serif';
  /** Familia para texto de UI y body. */
  bodyFont: 'geist-sans';
}

export interface SitePage {
  slug: string;
  metadata: PageMetadata;
  sections: Section[];
}

export interface PageMetadata {
  /** Title del navegador. */
  title: string;
  /** Meta description. */
  description: string;
  /** URL absoluta de un favicon (PNG o SVG). */
  favicon?: string;
}

export interface Section<T extends SectionType = SectionType> {
  /** ID estable usado por el agente para referirse a la sección. */
  id: string;
  type: T;
  variant: VariantOf<T>;
  /** Props específicas según (type, variant). Validadas por Zod. */
  props: Record<string, unknown>;
}

/* === Props específicas (referencia para Zod schemas) ====================
 *
 * Las definimos como interfaces para autocompletado y luego las
 * validamos en builder/schema.ts. La validación Zod es la fuente de
 * verdad en runtime; estos tipos son comodidad en desarrollo.
 */

export interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image?: string;
}

export interface FeaturesProps {
  title?: string;
  intro?: string;
  items: Array<{
    icon?: string;
    title: string;
    body: string;
  }>;
}

export interface TestimonialsProps {
  title?: string;
  items: Array<{
    quote: string;
    author: string;
    role?: string;
    avatar?: string;
  }>;
}

export interface ContactProps {
  title?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: Array<{ days: string; open: string; close: string }>;
  mapCenter?: { lat: number; lng: number };
}

export interface FAQProps {
  title?: string;
  items: Array<{ question: string; answer: string }>;
}

export interface FooterProps {
  copyright?: string;
  links?: Array<{ label: string; href: string }>;
  email?: string;
}
