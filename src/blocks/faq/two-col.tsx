import {
  BodyText,
  Container,
  DisplayHeading,
  Eyebrow,
  Section,
} from '@/blocks/_primitives';
import { faqPropsSchema, type FaqProps } from '@/lib/builder/schemas/faq';

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

/**
 * FAQ — variante "two-col".
 *
 * Layout editorial: izquierda fija con título + intro, derecha la lista
 * de preguntas. La columna izquierda hace de "anclaje" y deja la lista
 * respirar. En mobile se apila.
 */
export default function FaqTwoCol({ id, props }: BlockProps) {
  const parsed = faqPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: FaqProps = parsed.data;

  return (
    <Section id={id} tone="canvas">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-24">
              {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
              <DisplayHeading size="md" className="mt-4">
                {data.title ?? 'Preguntas frecuentes'}
              </DisplayHeading>
              {data.intro && <BodyText className="mt-5">{data.intro}</BodyText>}
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="border-t border-line">
              {data.items.map((item, idx) => (
                <details
                  key={idx}
                  className="group border-b border-line"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-left text-base font-medium text-ink-strong [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <span aria-hidden className="relative h-5 w-5 shrink-0">
                      <span className="absolute left-0 top-1/2 h-px w-5 -translate-y-1/2 bg-ink-strong" />
                      <span className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-ink-strong transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                    </span>
                  </summary>
                  <div className="pb-6 pr-12 text-base leading-body text-ink">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
