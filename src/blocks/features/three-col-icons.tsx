import {
  BodyText,
  Container,
  DisplayHeading,
  Eyebrow,
  Section,
} from '@/blocks/_primitives';
import { Icon, type IconName } from '@/components/ui/icon';
import {
  featuresPropsSchema,
  type FeaturesProps,
} from '@/lib/builder/schemas/features';

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

/**
 * Features — variante "three-col-icons".
 *
 * 3 (o 4) columnas iguales, cada una con icono Phosphor opcional, título
 * en sans-serif compacto y cuerpo. Sin tarjetas: separación por gap, no
 * por bordes — minimalist_ui.md prefiere "elimina cajas cuando puedas".
 */
export default function FeaturesThreeColIcons({ id, props }: BlockProps) {
  const parsed = featuresPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: FeaturesProps = parsed.data;

  const columns = data.items.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <Section id={id} tone="canvas">
      <Container>
        {(data.eyebrow || data.title || data.intro) && (
          <header className="max-w-editorial">
            {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
            {data.title && (
              <DisplayHeading size="md" className="mt-4">
                {data.title}
              </DisplayHeading>
            )}
            {data.intro && <BodyText className="mt-5">{data.intro}</BodyText>}
          </header>
        )}

        <div
          className={`mt-16 grid grid-cols-1 gap-x-10 gap-y-12 ${columns}`}
        >
          {data.items.map((item, idx) => (
            <article key={idx}>
              {item.icon && (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-surface-bone">
                  <Icon
                    name={item.icon as IconName}
                    size={20}
                    weight="bold"
                    className="text-ink-strong"
                  />
                </span>
              )}
              <h3 className="mt-5 text-base font-medium text-ink-strong">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-body text-ink-mute">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
