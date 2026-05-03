import { Container, DisplayHeading, Eyebrow, PrimaryButton, Section, SecondaryLink } from '@/blocks/_primitives';
import { Icon } from '@/components/ui/icon';
import { heroPropsSchema, type HeroProps } from '@/lib/builder/schemas/hero';

/**
 * Hero — variante "centered".
 *
 * Texto centrado, jerarquía editorial. La imagen, si existe, va debajo
 * del bloque de texto como elemento secundario que ancla la sección
 * sin competir con el titular.
 */

interface BlockProps {
  id: string;
  props: Record<string, unknown>;
}

export default function HeroCentered({ id, props }: BlockProps) {
  const parsed = heroPropsSchema.safeParse(props);
  if (!parsed.success) return <BrokenSection id={id} type="hero/centered" />;
  const data: HeroProps = parsed.data;

  return (
    <Section id={id} tone="canvas">
      <Container width="editorial" className="text-center">
        {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
        <DisplayHeading
          as="h1"
          size="xl"
          className="mt-5"
        >
          {data.title}
        </DisplayHeading>

        {data.subtitle && (
          <p className="mx-auto mt-6 max-w-prose text-lg leading-body text-ink">
            {data.subtitle}
          </p>
        )}

        {(data.primaryCta || data.secondaryCta) && (
          <div className="mt-10 flex items-center justify-center gap-5">
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

        {data.image && (
          <figure className="mx-auto mt-16 overflow-hidden rounded-lg border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.image}
              alt={data.imageAlt ?? ''}
              loading="lazy"
              className="h-auto w-full object-cover"
            />
          </figure>
        )}
      </Container>
    </Section>
  );
}

function BrokenSection({ id, type }: { id: string; type: string }) {
  if (process.env.NODE_ENV !== 'development') return null;
  return (
    <div
      data-block-id={id}
      className="mx-6 my-6 rounded-md border border-dashed border-accent-red-fg/40 p-6 font-mono text-xs text-accent-red-fg"
    >
      [{type}] props inválidos — sección omitida.
    </div>
  );
}
