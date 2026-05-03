/**
 * Catálogo cerrado del builder (modelo D).
 *
 * Es la fuente única de verdad sobre QUÉ puede crear el agente.
 *
 * Reglas:
 *   - El agente NO puede inventar tipos ni variantes fuera de este catálogo
 *   - Cada (type, variant) tiene un componente en src/blocks/{type}/{variant}.tsx
 *   - Cada (type, variant) tiene un Zod schema en src/lib/builder/schema.ts
 *
 * Cualquier cambio aquí requiere:
 *   1. Añadir el componente en blocks/
 *   2. Añadir su schema en builder/schema.ts
 *   3. Registrar el componente en blocks/registry.ts
 *   4. Versionar el system prompt del agente (lib/agent/system-prompt.ts)
 */

export const SECTION_TYPES = [
  'hero',
  'features',
  'testimonials',
  'contact',
  'faq',
  'footer',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

/**
 * Variantes disponibles por tipo. Mantén 2 por tipo en MVP.
 * Añadir variantes adicionales está en SHOULD del MoSCoW.
 */
export const VARIANTS_BY_TYPE = {
  hero: ['centered', 'split-image-right'],
  features: ['three-col-icons', 'bento'],
  testimonials: ['single-quote', 'three-col'],
  contact: ['address-hours', 'form-and-map'],
  faq: ['accordion-flat', 'two-col'],
  footer: ['minimal', 'three-col'],
} as const satisfies Record<SectionType, ReadonlyArray<string>>;

export type VariantOf<T extends SectionType> =
  (typeof VARIANTS_BY_TYPE)[T][number];

/** Variante por defecto si el agente no especifica una al crear. */
export const DEFAULT_VARIANT: { [T in SectionType]: VariantOf<T> } = {
  hero: 'centered',
  features: 'three-col-icons',
  testimonials: 'single-quote',
  contact: 'address-hours',
  faq: 'accordion-flat',
  footer: 'minimal',
};

export function isValidType(value: string): value is SectionType {
  return (SECTION_TYPES as ReadonlyArray<string>).includes(value);
}

export function isValidVariant<T extends SectionType>(
  type: T,
  variant: string
): variant is VariantOf<T> {
  return (VARIANTS_BY_TYPE[type] as ReadonlyArray<string>).includes(variant);
}
