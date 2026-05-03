import { z } from 'zod';

/**
 * Schema del bloque contact.
 *
 * address-hours: información de contacto + horarios listados
 * form-and-map: formulario simple (mailto:) + placeholder de mapa con coords
 *
 * El form de form-and-map abre mailto: en el navegador del visitante
 * con los campos rellenos. No requiere backend en MVP.
 */

const hoursRowSchema = z.object({
  /** Etiqueta libre: "Lunes a Viernes", "L-V", "Fin de semana"... */
  days: z.string().min(1).max(40),
  /** Formato 24h o libre: "08:00", "Cerrado", "9:00 - 14:00, 17:00 - 20:00". */
  hours: z.string().min(1).max(60),
});

export const contactPropsSchema = z.object({
  eyebrow: z.string().max(60).optional(),
  title: z.string().max(120).optional(),
  intro: z.string().max(280).optional(),

  address: z.string().max(220).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),

  hours: z.array(hoursRowSchema).max(7).optional(),

  /** Coordenadas para el placeholder de mapa en form-and-map. */
  mapCenter: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),

  /** Texto del botón de submit en form-and-map. Default: "Enviar mensaje". */
  formCtaLabel: z.string().max(40).optional(),
});

export type ContactProps = z.infer<typeof contactPropsSchema>;
