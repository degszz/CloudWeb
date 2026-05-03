import { z } from 'zod';

/**
 * Schema del bloque testimonials.
 *
 * single-quote: una sola cita grande, formato editorial
 * three-col: 3 testimonios en columnas
 *
 * En MVP el agente no puede inventar testimonios falsos: si el usuario
 * no le da quotes reales, debe pedírselas o no usar el bloque.
 * (System prompt cubre esto, pero validamos longitud aquí también.)
 */

const testimonialItemSchema = z.object({
  quote: z.string().min(20).max(400),
  author: z.string().min(2).max(80),
  role: z.string().max(120).optional(),
  /** URL pública del avatar (URL externa). */
  avatar: z.string().url().optional(),
});

export const testimonialsPropsSchema = z
  .object({
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(120).optional(),
    items: z.array(testimonialItemSchema).min(1).max(6),
  })
  .superRefine((data, ctx) => {
    // single-quote requiere exactamente 1 item; three-col idealmente 3.
    // No bloqueamos aquí (el componente se adapta), solo informamos.
    if (data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items'],
        message: 'Necesitas al menos un testimonio.',
      });
    }
  });

export type TestimonialsProps = z.infer<typeof testimonialsPropsSchema>;
