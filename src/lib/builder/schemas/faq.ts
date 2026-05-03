import { z } from 'zod';

/**
 * Schema del bloque faq.
 *
 * accordion-flat: lista plana, separada por bordes inferiores, expandible
 * two-col: izquierda título+intro, derecha la lista de preguntas
 */

const faqItemSchema = z.object({
  question: z.string().min(3).max(180),
  answer: z.string().min(3).max(800),
});

export const faqPropsSchema = z.object({
  eyebrow: z.string().max(60).optional(),
  title: z.string().max(120).optional(),
  intro: z.string().max(280).optional(),
  items: z.array(faqItemSchema).min(1).max(20),
});

export type FaqProps = z.infer<typeof faqPropsSchema>;
