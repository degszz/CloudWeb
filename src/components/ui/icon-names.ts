/**
 * Lista de nombres de iconos disponibles — sin importar React ni Phosphor.
 *
 * Usada por los Zod schemas (que corren en server) para validar que el
 * agente no invente nombres de iconos. Para renderizar iconos, usar
 * Icon de '@/components/ui/icon'.
 */

export const ICON_NAMES = [
  'arrow-right',
  'arrow-up-right',
  'calendar',
  'check',
  'chevron-down',
  'clock',
  'coffee',
  'envelope',
  'eye',
  'globe',
  'heart',
  'house',
  'image',
  'list',
  'search',
  'map-pin',
  'minus',
  'paper-plane',
  'phone',
  'plus',
  'sparkle',
  'storefront',
  'user',
  'wifi',
  'x',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
