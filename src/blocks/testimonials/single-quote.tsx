import { Container, Eyebrow, Section } from '@/blocks/_primitives';
import {
  testimonialsPropsSchema,
  type TestimonialsProps,
} from '@/lib/builder/schemas/testimonials';

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

/**
 * Testimonials — variante "single-quote".
 *
 * Una cita en formato editorial. Sin imagen del autor (peso visual de la
 * frase manda). Si hay más items en el array, mostramos solo el primero.
 */
export default function TestimonialsSingleQuote({ id, props }: BlockProps) {
  const parsed = testimonialsPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: TestimonialsProps = parsed.data;
  const item = data.items[0];
  if (!item) return null;

  return (
    <Section id={id} tone="bone">
      <Container width="editorial" className="text-center">
        {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}

        <blockquote className="mt-8">
          <p className="font-display text-3xl leading-display tracking-display text-ink-strong md:text-5xl">
            <span aria-hidden className="text-ink-faint">“</span>
            {item.quote}
            <span aria-hidden className="text-ink-faint">”</span>
          </p>

          <footer className="mt-10 text-sm text-ink-mute">
            <span className="font-medium text-ink">{item.author}</span>
            {item.role && <span> · {item.role}</span>}
          </footer>
        </blockquote>
      </Container>
    </Section>
  );
}
