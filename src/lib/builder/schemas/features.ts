import { z } from 'zod';

import { ICON_MAP } from '@/components/ui/icon';

/**
 * Schema del bloque features.
 *
 * three-col-icons: 3 columnas iguales, cada una con icono + título + cuerpo
 * bento: 4 items en grid asimétrico (1 grande + 3 pequeños)
 *
 * Constreñimos el icono al ICON_MAP del wrapper de Phosphor — el agente
 * no puede inventar nombres de iconos.
 */

const iconNameSchema = z.enum(
  Object.keys(ICON_MAP) as [keyof typeof ICON_MAP, ...Array<keyof typeof ICON_MAP>]
);

const featureItemSchema = z.object({
  icon: iconNameSchema.optional(),
  title: z.string().min(1).max(60),
  body: z.string().min(1).max(220),
});

export const featuresPropsSchema = z.object({
  eyebrow: z.string().max(60).optional(),
  title: z.string().max(120).optional(),
  intro: z.string().max(280).optional(),
  items: z.array(featureItemSchema).min(3).max(4),
});

export type FeaturesProps = z.infer<typeof featuresPropsSchema>;
