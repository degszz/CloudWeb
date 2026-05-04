import 'server-only';

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  // No fallamos en build: el email no es crítico para que la app arranque.
  // Pero loguea para que se note antes de producción.
  console.warn('[email] RESEND_API_KEY no está definida — los emails no se enviarán');
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder');

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'nuweb <hola@nuweb.app>';
