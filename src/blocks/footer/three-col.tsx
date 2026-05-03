import { Container } from '@/blocks/_primitives';
import {
  footerPropsSchema,
  type FooterProps,
} from '@/lib/builder/schemas/footer';

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

/**
 * Footer — variante "three-col".
 *
 * 3 columnas:
 *   - Brand + tagline (izq)
 *   - Links de navegación (centro)
 *   - Contacto (derecha)
 *
 * Línea inferior con copyright separada por divisor.
 */
export default function FooterThreeCol({ id, props }: BlockProps) {
  const parsed = footerPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: FooterProps = parsed.data;

  const year = new Date().getFullYear();
  const copyright = data.copyright ?? `© ${year} ${data.brand}`;

  return (
    <footer id={id} className="border-t border-line bg-canvas">
      <Container>
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-3 md:gap-8">
          <div>
            <span className="font-display text-2xl tracking-display text-ink-strong">
              {data.brand}
            </span>
            {data.tagline && (
              <p className="mt-3 max-w-xs text-sm text-ink-mute">
                {data.tagline}
              </p>
            )}
          </div>

          {data.links && data.links.length > 0 && (
            <nav>
              <p className="text-xs uppercase tracking-caps text-ink-mute">
                Navegación
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                {data.links.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.href} className="hover:text-ink-strong">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {(data.email || data.phone) && (
            <div>
              <p className="text-xs uppercase tracking-caps text-ink-mute">
                Contacto
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                {data.email && (
                  <li>
                    <a
                      href={`mailto:${data.email}`}
                      className="hover:text-ink-strong"
                    >
                      {data.email}
                    </a>
                  </li>
                )}
                {data.phone && (
                  <li>
                    <a
                      href={`tel:${data.phone.replace(/\s/g, '')}`}
                      className="hover:text-ink-strong"
                    >
                      {data.phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-line py-6 text-sm text-ink-mute">
          {copyright}
        </div>
      </Container>
    </footer>
  );
}
