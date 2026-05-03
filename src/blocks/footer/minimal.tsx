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
 * Footer — variante "minimal".
 *
 * Una sola fila: marca a la izquierda, links a la derecha. Copyright
 * debajo en pantallas estrechas. Discreto pero presente.
 */
export default function FooterMinimal({ id, props }: BlockProps) {
  const parsed = footerPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: FooterProps = parsed.data;

  const year = new Date().getFullYear();
  const copyright = data.copyright ?? `© ${year} ${data.brand}`;

  return (
    <footer id={id} className="border-t border-line bg-canvas">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 py-10 text-sm text-ink-mute md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg tracking-display text-ink-strong">
              {data.brand}
            </span>
            <span className="hidden md:inline">{copyright}</span>
          </div>

          {data.links && data.links.length > 0 && (
            <nav className="flex flex-wrap gap-6">
              {data.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="hover:text-ink-strong"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          <span className="md:hidden">{copyright}</span>
        </div>
      </Container>
    </footer>
  );
}
