import {
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
 * FAQ — variante "accordion-flat".
 *
 * Sigue minimalist_ui §5: "Elimina todas las cajas contenedoras. Separa
 * los ítems únicamente con un border-bottom: 1px solid #EAEAEA. Usa un
 * icono limpio y nítido de + y - para el estado toggle."
 *
 * Implementación con <details>/<summary> nativo: sin JS, sin librería.
 * Accesible por defecto. El icono +/- es CSS puro con [open]:rotate.
 */
export default function FaqAccordionFlat({ id, props }: BlockProps) {
  const parsed = faqPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: FaqProps = parsed.data;

  return (
    <Section id={id} tone="canvas">
      <Container width="editorial">
        {(data.eyebrow || data.title || data.intro) && (
          <header>
            {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
            {data.title && (
              <DisplayHeading size="md" className="mt-4">
                {data.title}
              </DisplayHeading>
            )}
            {data.intro && (
              <p className="mt-5 max-w-prose text-lg leading-body text-ink">
                {data.intro}
              </p>
            )}
          </header>
        )}

        <div className="mt-12 border-t border-line">
          {data.items.map((item, idx) => (
            <details
              key={idx}
              className="group border-b border-line"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 text-left text-base font-medium text-ink-strong transition-colors hover:text-[#000000] [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className="relative h-5 w-5 shrink-0"
                >
                  {/* Icono +/- en CSS puro */}
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
      </Container>
    </Section>
  );
}
