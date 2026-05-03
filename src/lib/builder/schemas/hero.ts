import { z } from 'zod';

/**
 * Schema del bloque hero.
 *
 * Las dos variantes (centered, split-image-right) comparten el mismo
 * shape de props. La diferencia es solo de layout. Esto simplifica
 * el cambio de variante: no hay que migrar props.
 */

const ctaSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1),
});

export const heroPropsSchema = z.object({
  eyebrow: z.string().max(60).optional(),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(280).optional(),
  primaryCta: ctaSchema.optional(),
  secondaryCta: ctaSchema.optional(),
  /** URL pública de imagen externa (Unsplash, Pexels, propia). */
  image: z.string().url().optional(),
  /** Texto alt de la imagen. */
  imageAlt: z.string().max(140).optional(),
});

export type HeroProps = z.infer<typeof heroPropsSchema>;
