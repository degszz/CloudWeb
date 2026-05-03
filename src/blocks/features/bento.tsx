import {
  BodyText,
  Container,
  DisplayHeading,
  Eyebrow,
  Section,
} from '@/blocks/_primitives';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import {
  featuresPropsSchema,
  type FeaturesProps,
} from '@/lib/builder/schemas/features';

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

/**
 * Features — variante "bento".
 *
 * Grid asimétrico siguiendo minimalist_ui §5: borde 1px, radius 12px max,
 * padding generoso, sin sombras pesadas.
 *
 * Layout: el primer item ocupa 2 columnas (énfasis), los 3 siguientes
 * ocupan 1 columna cada uno. En mobile todos apilan a 1 columna.
 */
export default function FeaturesBento({ id, props }: BlockProps) {
  const parsed = featuresPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: FeaturesProps = parsed.data;

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

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {data.items.map((item, idx) => (
            <article
              key={idx}
              className={cn(
                'rounded-lg border border-line bg-surface p-8 md:p-10',
                'transition-shadow duration-200 hover:shadow-md',
                idx === 0 && 'md:col-span-2 md:row-span-1'
              )}
            >
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
              <h3
                className={cn(
                  'mt-6 text-ink-strong',
                  idx === 0
                    ? 'font-display text-3xl tracking-display leading-display'
                    : 'text-base font-medium'
                )}
              >
                {item.title}
              </h3>
              <p
                className={cn(
                  'leading-body text-ink',
                  idx === 0 ? 'mt-4 text-base' : 'mt-2 text-sm text-ink-mute'
                )}
              >
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
