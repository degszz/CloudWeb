import {
  Container,
  DisplayHeading,
  Eyebrow,
  Section,
} from '@/blocks/_primitives';
import {
  testimonialsPropsSchema,
  type TestimonialsProps,
} from '@/lib/builder/schemas/testimonials';

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

/**
 * Testimonials — variante "three-col".
 *
 * 3 testimonios en columnas con tarjetas planas (border 1px, sin sombra
 * por defecto). Avatar opcional al pie como elemento de identidad ligero.
 *
 * Si hay menos de 3 items, las columnas se mantienen alineadas.
 * Si hay más de 3, mostramos los primeros 3.
 */
export default function TestimonialsThreeCol({ id, props }: BlockProps) {
  const parsed = testimonialsPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: TestimonialsProps = parsed.data;
  const items = data.items.slice(0, 3);

  return (
    <Section id={id} tone="canvas">
      <Container>
        {(data.eyebrow || data.title) && (
          <header className="max-w-editorial">
            {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
            {data.title && (
              <DisplayHeading size="md" className="mt-4">
                {data.title}
              </DisplayHeading>
            )}
          </header>
        )}

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item, idx) => (
            <figure
              key={idx}
              className="rounded-lg border border-line bg-surface p-8"
            >
              <blockquote className="text-base leading-body text-ink">
                {item.quote}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                {item.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.avatar}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 rounded-pill object-cover"
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium text-ink-strong">{item.author}</p>
                  {item.role && (
                    <p className="text-ink-mute">{item.role}</p>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}
