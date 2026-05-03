import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases Tailwind respetando overrides.
 * Patrón estándar shadcn/ui.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Construye la URL pública completa de un sitio publicado. */
export function getPublishedUrl(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_PUBLISH_DOMAIN ?? 'localhost:3000';
  const protocol = domain.startsWith('localhost') ? 'http' : 'https';
  return `${protocol}://${slug}.${domain}`;
}

/** Formatea cantidades USD en céntimos para mostrar al usuario. */
export function formatUSD(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amountCents / 100);
}
