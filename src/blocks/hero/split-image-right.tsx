import {
  Container,
  DisplayHeading,
  Eyebrow,
  PrimaryButton,
  Section,
  SecondaryLink,
} from '@/blocks/_primitives';
import { Icon } from '@/components/ui/icon';
import { heroPropsSchema, type HeroProps } from '@/lib/builder/schemas/hero';

/**
 * Hero — variante "split-image-right".
 *
 * Layout asimétrico: texto en columna izquierda (5/12), imagen en columna
 * derecha (7/12). En mobile se apila — texto arriba, imagen abajo.
 */

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

export default function HeroSplitImageRight({ id, props }: BlockProps) {
  const parsed = heroPropsSchema.safeParse(props);
  if (!parsed.success) return null;
  const data: HeroProps = parsed.data;

  return (
    <Section id={id} tone="canvas">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16 md:items-center">
          {/* Columna texto */}
          <div className="md:col-span-5">
            {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
            <DisplayHeading as="h1" size="lg" className="mt-5">
              {data.title}
            </DisplayHeading>

            {data.subtitle && (
              <p className="mt-6 max-w-prose text-lg leading-body text-ink">
                {data.subtitle}
              </p>
            )}

            {(data.primaryCta || data.secondaryCta) && (
              <div className="mt-8 flex items-center gap-5">
                {data.primaryCta && (
                  <PrimaryButton href={data.primaryCta.href}>
                    {data.primaryCta.label}
                    <Icon name="arrow-right" size={16} />
                  </PrimaryButton>
                )}
                {data.secondaryCta && (
                  <SecondaryLink href={data.secondaryCta.href}>
                    {data.secondaryCta.label} →
                  </SecondaryLink>
                )}
              </div>
            )}
          </div>

          {/* Columna imagen */}
          <div className="md:col-span-7">
            {data.image ? (
              <figure className="overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.image}
                  alt={data.imageAlt ?? ''}
                  loading="lazy"
                  className="aspect-[4/3] h-auto w-full object-cover"
                />
              </figure>
            ) : (
              <div className="aspect-[4/3] rounded-lg border border-dashed border-line bg-surface-bone" />
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
