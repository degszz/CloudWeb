import { z } from 'zod';

/**
 * Schema del bloque footer.
 *
 * minimal: una línea con nombre + copyright + 3-4 links
 * three-col: 3 columnas (brand+tagline / navegación / contacto)
 */

const footerLinkSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1),
});

export const footerPropsSchema = z.object({
  /** Nombre o marca del sitio (pequeño, en lugar del logo). */
  brand: z.string().min(1).max(60),
  /** Tagline corto, solo en variante three-col. */
  tagline: z.string().max(120).optional(),
  /** Texto de copyright. Si no se da, se construye con el año actual + brand. */
  copyright: z.string().max(120).optional(),
  /** Links de navegación / legales. */
  links: z.array(footerLinkSchema).max(8).optional(),
  /** Contacto (solo three-col). */
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
});

export type FooterProps = z.infer<typeof footerPropsSchema>;
